import React, { useState, useEffect } from "react";
import "../../assets/css/App.css";
import TextField from "@mui/material/TextField";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
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
    error: String;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExecution, setIsExecution] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openErrorDialog, setOpenErrorDialog] = useState<boolean>(false);

  const textStyle = { width: "250px", margin: "auto" };

  const buttonContents = {
    "1年前": 365,
    "6カ月前": 90,
    "1カ月前": 30,
    "1週間前": 7,
  };

  const tableLabels = [
    "企業名(英名)",
    "前日の価格（実績値）",
    "明日の価格（予測値）",
    "予想スコア（乖離値）",
  ];

  // ***********************************************
  // *
  // *  イベント
  // *
  // ***********************************************

  useEffect(() => {
    chart_update();
  }, [realData]);

  const validateCode = (code: string): string | null => {
    if (!code) return "銘柄コードを入力してください。";
    if (code.length < 4) return "銘柄コードは4文字以上で入力してください。";
    if (!/^[A-Z0-9]+$/.test(code))
      return "銘柄コードは英大文字または数字のみです。";
    return null;
  };

  const handleAnalyzeClick = () => {
    const error = validateCode(code);
    setErrorMessage(error);

    if (!error) {
      get_prediction(code);
    }
  };

  const get_prediction = async (code: string) => {
    try {
      setIsLoading(true);
      const res = await axios.get<Data>(
        `${process.env.REACT_APP_KABUMMIKE_URL}/api/stock_price_prediction/?code=${code}`
      );
      if (res.status === 200) {
        await set_pred_data(res.data);
        setIsExecution(true);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail;
      setErrorMessage(errorMessage);
      setIsExecution(false);
      setOpenErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const set_pred_data = async (data: Data) => {
    const labels: string[] = Object.keys(data.prediction.close_pred);
    const pred: number[] = Object.values(data.prediction.close_pred);
    const real: number[] = Object.values(data.prediction.close_next);
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

  const handleCloseDialog = () => {
    setOpenErrorDialog(false);
  };

  return (
    <section>
      <h1>重回帰分析による翌日の日本株個別銘柄株価予想</h1>
      <div>
        <TextField
          id="standard-basic"
          label="銘柄コード"
          variant="standard"
          style={textStyle}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={!!errorMessage}
          helperText={errorMessage}
        />
        <Button
          variant="contained"
          disabled={isLoading}
          onClick={handleAnalyzeClick}
        >
          分析開始
        </Button>
      </div>

      {isExecution ? (
        <div>
          <CaptionTable contents={analysis} labels={tableLabels} />
          <ColorToggleButton
            contents={buttonContents}
            onParentButtonClick={handleChildClick}
          />
          <Line data={chartData} />
        </div>
      ) : null}

      {/* エラーダイアログ */}
      <Dialog open={openErrorDialog} onClose={handleCloseDialog}>
        <DialogTitle>エラー</DialogTitle>
        <DialogContent>
          <p>{errorMessage}</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};

export default Analysis;
