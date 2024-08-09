import React, { useState } from "react";
import "../../assets/css/App.css";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import axios from "axios";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import ColorToggleButton from "../UIkit/ColorToggleButton";

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

  // 活性制御変数
  // ローディング中かどうか
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 分析が実行されたかどうか
  const [isExecution, setIsExecution] = useState<boolean>(false);

  //Paperタグ内のスタイリングの変数
  const textStyle = { width: "250px", margin: "auto" };

  const buttonContents = {
    "1年前": 365,
    "6カ月前": 90,
    "1カ月前": 30,
    "1週間前": 7,
  };
  // ***********************************************
  // *
  // *  イベント
  // *
  // ***********************************************

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
      chart_update();
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
    setLastValue(real.at(-1)?.toString() || "");
    setPredValue(pred.at(-1)?.toString() || "");
    setScore(data.prediction.score);
    setCompany(data.company);
  };

  // 期間で絞る
  // 子コンポーネントから引数を受け取る関数
  const handleChildClick = (days: number) => {
    setPredData(predDataStorage.slice(-days));
    setRealData(realDataStorage.slice(-days));
    setLabelData(labelDataStorage.slice(-days));
    chart_update();
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
          <h1>
            企業名：{company}（株式コード：{code}）
          </h1>

          <h1>前日の価格（実績値）:{lastValue}</h1>
          <h1>明日の価格（予測値）:{predValue}</h1>
          <h1>予測スコア:{score}</h1>
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
