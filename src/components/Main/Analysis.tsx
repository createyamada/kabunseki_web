import React, { useState, useEffect } from "react";
import "../../assets/css/App.css";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import axios from "axios";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import ColorToggleButton from "../UIkit/ColorToggleButton";
import CaptionTable from "../UIkit/CaptionTable";

const Analysis: React.FC = () => {
  // ***********************************************
  // *
  // *  型定義
  // *
  // ***********************************************
  interface Prediction {
    close_next: Record<string, number>;
    close_pred: Record<string, number>;
    score: string;
  }

  interface Data {
    company: string;
    prediction: Prediction;
  }

  interface Analysis {
    company: string;
    lastValue: string;
    predValue: string;
    score: string;
  }

  // ***********************************************
  // *
  // *  状態管理
  // *
  // ***********************************************
  // 表示管理用変数
  const [code, setCode] = useState<string>("");
  const [lastValue, setLastValue] = useState<string>("");
  const [predValue, setPredValue] = useState<string>("");
  const [predDataStorage, setPredDataStorage] = useState<number[]>([]);
  const [realDataStorage, setRealDataStorage] = useState<number[]>([]);
  const [labelDataStorage, setLabelDataStorage] = useState<string[]>([]);
  const [labelData, setLabelData] = useState<string[]>([]);
  const [predData, setPredData] = useState<number[]>([]);
  const [realData, setRealData] = useState<number[]>([]);
  const [score, setScore] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [chartData, setChartData] = useState<any>({});
  const [analysis, setAnalysis] = useState<Analysis>({
    company: "",
    lastValue: "",
    predValue: "",
    score: "",
  });

  // 活性制御変数
  // ローディング中かどうか
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 分析が実行されたかどうか
  const [isExecution, setIsExecution] = useState<boolean>(false);

  //Paperタグ内のスタイリングの変数
  const textStyle = { width: "250px", margin: "auto" };

  // ボタンを表示するためのオブジェクト
  const buttonContents = {
    "1年前": 365,
    "6カ月前": 90,
    "1カ月前": 30,
    "1週間前": 7,
  };

  // テーブルを表示するためのオブジェクト
  const tableLabels = [
    "企業名(英名)",
    "前日の価格（実績値）",
    "明日の価格（予測値）",
    "予想スコア（乖離値）",
  ];

  const caption =
    "こちらは重回帰分析を元に作成した予測値です、正しい値ではありません";
  // ***********************************************
  // *
  // *  イベント
  // *
  // ***********************************************

  useEffect(() => {
    // グラフ表示データに変更があればグラフ再描画
    chart_update();
  }, [realData]);

  // APIより予測を取得
  const get_prediction = async (code: string) => {
    try {
      // ローディングを開始
      setIsLoading(true);
      const res = await axios.get<Data>(
        `${process.env.REACT_APP_KABUMMIKE_ARL}/api/stock_price_prediction/?code=${code}`
      );
      const data = res.data;
      // グラフ用にデータを整形しセット
      await set_pred_data(data);
      // グラフを描画
      // await chart_update();
      // 実行フラグ
      setIsExecution(true);
    } catch (error) {
      console.error("Error fetching data: ", error);
      // 実行状態を解除
      setIsExecution(false);
    } finally {
      // ローディング状態を解除
      setIsLoading(false);
    }
  };

  const set_pred_data = async (data: Data) => {
    // データをグラフ用に整形
    // 評価データを取得
    const labels: string[] = Object.keys(data.prediction.close_pred);

    // データを整形する
    const pred: number[] = Object.values(data.prediction.close_pred);
    const real: number[] = Object.values(data.prediction.close_next);
    // 最後の値を削除
    real.pop();

    setLabelDataStorage(labels);
    setLabelData(labels);
    setPredDataStorage(pred);
    setRealDataStorage(real);
    setPredData(pred);
    setRealData(real);
    setCode(code);

    setAnalysis({
      company: data.company + `（株式コード：${code}）`,
      lastValue: real.at(-1)?.toString() || "",
      predValue: pred.at(-1)?.toString() || "",
      score: data.prediction.score,
    });
  };

  // 期間で絞る
  // 子コンポーネントから引数を受け取る関数
  const handleChildClick = async (days: number) => {
    setPredData(predDataStorage.slice(-days));
    setLabelData(labelDataStorage.slice(-days));
    setRealData(realDataStorage.slice(-days));
  };

  const chart_update = () => {
    setChartData({
      labels: labelData,
      datasets: [
        {
          label: "予想株価遷移",
          data: predData,
          backgroundColor: "rgba(75,192,192,0.4)",
          borderColor: "rgba(75,192,192,1)",
          borderWidth: 1,
        },
        {
          label: "実際株価遷移",
          data: realData,
          backgroundColor: "rgba(255,0,0,0.4)",
          borderColor: "rgba(255,0,0,1)",
          borderWidth: 1,
        },
      ],
    });
  };

  return (
    <section>
      <h1>重回帰分析による翌日の株価予想</h1>
      <div>
        {/* コードテキストボックス */}
        <TextField
          id="standard-basic"
          label="銘柄コード"
          variant="standard"
          style={textStyle}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {/* submitボタン押下 */}
        <Button
          variant="contained"
          disabled={isLoading}
          onClick={() => get_prediction(code)}
        >
          分析開始
        </Button>
      </div>

      {isExecution ? (
        <div>
          <CaptionTable
            contents={analysis}
            labels={tableLabels}
            caption={caption}
          />
          <ColorToggleButton
            contents={buttonContents}
            onParentButtonClick={handleChildClick}
          />
          <Line data={chartData} />
        </div>
      ) : null}
    </section>
  );
};
export default Analysis;
