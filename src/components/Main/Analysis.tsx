import React, { useState } from "react";
import "../../assets/css/App.css";
import TextField from "@mui/material/TextField";
import { Button } from "@mui/material";
import axios from "axios";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

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

  //Paperタグ内のスタイリングの変数
  const textStyle = { width: "250px", margin: "auto" };

  // ***********************************************
  // *
  // *  イベント
  // *
  // ***********************************************

  // APIより予測を取得
  const get_prediction = async (code: string) => {
    try {
      const res = await axios.get<Data>(
        `${process.env.REACT_APP_KABUMMIKE_ARL}/api/stock_price_prediction/?code=${code}`
      );
      const data = res.data;
      // グラフ用にデータを整形しセット
      await set_pred_data(data);
      // グラフを描画
      chart_update();
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const set_pred_data = async (data: Data) => {
    // データをグラフ用に整形
    // 評価データを取得
    const labels: string[] = Object.keys(data.prediction.close_pred);
    const labelstest: string[] = Object.keys(data.prediction.close_next);

    setLabelDataStorage(labels);
    setLabelData(labels);
    setPredDataStorage(Object.values(data.prediction.close_pred));
    setRealDataStorage(Object.values(data.prediction.close_next));
    setPredData(Object.values(data.prediction.close_pred));
    setRealData(Object.values(data.prediction.close_next));

    setCode(code);
    setLastValue(realData[labelstest.length - 1]?.toString() || "");
    setPredValue(predData[labels.length - 1]?.toString() || "");
    setScore(data.prediction.score);
    setCompany(data.company);
  };

  // 期間で絞る
  const period_narrowing = (prev: number) => {
    setPredData(predDataStorage.slice(-prev));
    setRealData(realDataStorage.slice(-prev));
    setLabelData(labelDataStorage.slice(-prev));
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
        {/* ユーザー名テキストボックス */}
        <TextField
          id="standard-basic"
          label="銘柄コード"
          variant="standard"
          style={textStyle}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {/* submitボタン押下 */}
        <Button variant="contained" onClick={() => get_prediction(code)}>
          分析開始
        </Button>
      </div>

      <div>
        <h1>
          企業名：{company}（株式コード：{code}）
        </h1>
        {/* submitボタン押下 */}
        <Button variant="contained" onClick={() => period_narrowing(365)}>
          直近1年
        </Button>
        <Button variant="contained" onClick={() => period_narrowing(180)}>
          直近6カ月
        </Button>
        <Button variant="contained" onClick={() => period_narrowing(90)}>
          直近3カ月
        </Button>
        <Button variant="contained" onClick={() => period_narrowing(30)}>
          直近1カ月
        </Button>
        <Button variant="contained" onClick={() => period_narrowing(7)}>
          直近1週間
        </Button>
        {chartData.labels ? <Line data={chartData} /> : <p>Loading data...</p>}
        <h1>前日の価格（実績値）:{lastValue}</h1>
        <h1>明日の価格（予測値）:{predValue}</h1>
        <h1>予測スコア:{score}</h1>
      </div>
    </section>
  );
};
export default Analysis;
