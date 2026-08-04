import React, { useMemo, useState } from "react";
import "../../assets/css/App.css";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import ColorToggleButton from "../UIkit/ColorToggleButton";

interface PredictionInterval {
  confidence: number;
  lower_return: number;
  upper_return: number;
  lower_price: number;
  upper_price: number;
}

interface Metrics {
  rmse: number;
  mae: number;
  baseline_rmse: number;
  return_rmse: number;
  return_mae: number;
  baseline_return_rmse: number;
  rmse_improvement_rate: number;
  directional_accuracy: number;
  test_samples: number;
  training_samples: number;
}

interface Backtest {
  strategy_return: number;
  buy_and_hold_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  trade_count: number;
  transaction_cost_rate: number;
  signal_threshold: number;
}

interface ModelResult {
  walk_forward_rmse: number;
  holdout_rmse: number;
}

interface Prediction {
  close_next: Record<string, number>;
  close_pred: Record<string, number>;
  score: number;
  target?: string;
  selected_model?: string;
  predicted_return?: number;
  prediction_interval?: PredictionInterval;
  model_comparison?: Record<string, ModelResult>;
  backtest?: Backtest;
  metrics?: Metrics;
}

interface ApiResponse {
  company: string;
  prediction: Prediction;
}

const periods: Record<string, number> = {
  "1年": 365,
  "6カ月": 90,
  "1カ月": 30,
  "1週間": 7,
};

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("ja-JP", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatYen = (value?: number) =>
  Number.isFinite(value) ? yenFormatter.format(value as number) : "—";

const formatPercent = (value?: number) =>
  Number.isFinite(value) ? percentFormatter.format(value as number) : "—";

const modelName = (value?: string) => {
  const names: Record<string, string> = {
    linear_regression: "線形回帰",
    ridge: "Ridge回帰",
    gradient_boosting: "勾配ブースティング",
  };
  return value ? names[value] ?? value : "—";
};

const MetricCard: React.FC<{
  label: string;
  value: React.ReactNode;
  note?: string;
  accent?: boolean;
}> = ({ label, value, note, accent = false }) => (
  <Paper className={`analysis-metric-card${accent ? " is-accent" : ""}`} elevation={0}>
    <Typography className="analysis-metric-label">{label}</Typography>
    <Typography className="analysis-metric-value">{value}</Typography>
    {note && <Typography className="analysis-metric-note">{note}</Typography>}
  </Paper>
);

const Analysis: React.FC = () => {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [days, setDays] = useState(365);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);

  const validateCode = (value: string): string | null => {
    if (!value) return "銘柄コードを入力してください。";
    if (!/^\d{4}$/.test(value)) return "銘柄コードは4桁の数字で入力してください。";
    return null;
  };

  const handleAnalyzeClick = async () => {
    const normalizedCode = code.trim();
    const validationError = validateCode(normalizedCode);
    setErrorMessage(validationError);
    if (validationError) return;

    try {
      setIsLoading(true);
      setResult(null);
      const response = await axios.get<ApiResponse>(
        `${process.env.REACT_APP_KABUMMIKE_URL}/api/stock_price_prediction/`,
        { params: { code: normalizedCode } }
      );
      setResult(response.data);
      setDays(365);
      setErrorMessage(null);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      setErrorMessage(
        typeof detail === "string"
          ? detail
          : "分析結果を取得できませんでした。時間をおいて再度お試しください。"
      );
      setOpenErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const prediction = result?.prediction;
  const predictedEntries = useMemo(
    () => Object.entries(prediction?.close_pred ?? {}),
    [prediction]
  );
  const actualByDate = prediction?.close_next ?? {};
  const visibleEntries = predictedEntries.slice(-days);
  const labels = visibleEntries.map(([date]) => date);
  const predictedPrices = visibleEntries.map(([, value]) => value);
  const actualPrices = visibleEntries.map(([date]) => {
    const value = actualByDate[date];
    return Number.isFinite(value) && value !== 0 ? value : null;
  });

  const latestActualEntry = Object.entries(actualByDate)
    .filter(([, value]) => Number.isFinite(value) && value !== 0)
    .at(-1);
  const nextPredictionEntry = predictedEntries.at(-1);
  const interval = prediction?.prediction_interval;
  const metrics = prediction?.metrics;
  const backtest = prediction?.backtest;

  const chartData = {
    labels,
    datasets: [
      {
        label: "予測株価",
        data: predictedPrices,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.2,
      },
      {
        label: "実績株価",
        data: actualPrices,
        borderColor: "#475569",
        backgroundColor: "rgba(71, 85, 105, 0.08)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.2,
        spanGaps: false,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatYen(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: { ticks: { callback: (value: number) => `¥${value.toLocaleString("ja-JP")}` } },
    },
  };

  return (
    <section className="analysis-page">
      <Box className="analysis-hero">
        <Typography component="h1" className="analysis-title">
          日本株・翌営業日の株価予測
        </Typography>
        <Typography className="analysis-subtitle">
          銘柄コードを入力すると、最新データを使った予測とモデル評価を確認できます。
        </Typography>
        <Stack className="analysis-form" direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="銘柄コード"
            placeholder="例：7203"
            value={code}
            inputProps={{ inputMode: "numeric", maxLength: 4 }}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, ""));
              setErrorMessage(null);
            }}
            onKeyDown={(event) => event.key === "Enter" && handleAnalyzeClick()}
            error={!!errorMessage && !openErrorDialog}
            helperText={!openErrorDialog ? errorMessage : null}
            fullWidth
          />
          <Button
            className="analysis-submit"
            variant="contained"
            disabled={isLoading}
            onClick={handleAnalyzeClick}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "分析する"}
          </Button>
        </Stack>
      </Box>

      {result && prediction && (
        <Stack spacing={3} className="analysis-results">
          <Box>
            <Typography component="h2" className="analysis-company">
              {result.company}
            </Typography>
            <Typography color="text.secondary">銘柄コード：{code}</Typography>
          </Box>

          <Box className="analysis-metric-grid">
            <MetricCard
              label={`${latestActualEntry?.[0] ?? "直近"} 終値`}
              value={formatYen(latestActualEntry?.[1])}
            />
            <MetricCard
              label={`${nextPredictionEntry?.[0] ?? "翌営業日"} 予測株価`}
              value={formatYen(nextPredictionEntry?.[1])}
              note={`予測収益率 ${formatPercent(prediction.predicted_return)}`}
              accent
            />
            <MetricCard
              label="予測レンジ"
              value={
                interval
                  ? `${formatYen(interval.lower_price)} 〜 ${formatYen(interval.upper_price)}`
                  : "—"
              }
              note={interval ? `${Math.round(interval.confidence * 100)}%予測区間` : undefined}
            />
            <MetricCard
              label="採用モデル"
              value={modelName(prediction.selected_model)}
              note="時系列交差検証で選択"
            />
          </Box>

          {metrics && (
            <Paper className="analysis-panel" elevation={0}>
              <Typography component="h3" className="analysis-section-title">モデル評価</Typography>
              <Box className="analysis-detail-grid">
                <MetricCard label="価格 RMSE" value={formatYen(metrics.rmse)} note="小さいほど良好" />
                <MetricCard label="価格 MAE" value={formatYen(metrics.mae)} note="平均的な予測誤差" />
                <MetricCard
                  label="ベースライン比改善率"
                  value={formatPercent(metrics.rmse_improvement_rate)}
                  note="価格変化なし予測との比較"
                />
                <MetricCard
                  label="方向一致率"
                  value={formatPercent(metrics.directional_accuracy)}
                  note={`${metrics.test_samples.toLocaleString()}件で評価`}
                />
              </Box>
            </Paper>
          )}

          {backtest && (
            <Paper className="analysis-panel" elevation={0}>
              <Typography component="h3" className="analysis-section-title">バックテスト</Typography>
              <Box className="analysis-detail-grid">
                <MetricCard label="戦略リターン" value={formatPercent(backtest.strategy_return)} />
                <MetricCard label="買い持ちリターン" value={formatPercent(backtest.buy_and_hold_return)} />
                <MetricCard label="シャープレシオ" value={backtest.sharpe_ratio.toFixed(2)} />
                <MetricCard label="最大ドローダウン" value={formatPercent(backtest.max_drawdown)} />
              </Box>
            </Paper>
          )}

          <Paper className="analysis-panel analysis-chart-panel" elevation={0}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
            >
              <Box>
                <Typography component="h3" className="analysis-section-title">株価推移</Typography>
                <Typography color="text.secondary">予測値と実績値を同じ日付で比較します。</Typography>
              </Box>
              <ColorToggleButton contents={periods} onParentButtonClick={setDays} />
            </Stack>
            <Box className="analysis-chart">
              <Line data={chartData} options={chartOptions} />
            </Box>
          </Paper>

          <Alert severity="warning" variant="outlined">
            本結果は過去データに基づく統計的な予測で、将来の株価や収益を保証するものではありません。投資判断はご自身の責任で行ってください。
          </Alert>
        </Stack>
      )}

      <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)}>
        <DialogTitle>分析できませんでした</DialogTitle>
        <DialogContent><Typography>{errorMessage}</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenErrorDialog(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </section>
  );
};

export default Analysis;
