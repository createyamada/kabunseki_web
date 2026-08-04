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
  fold_scores: number[];
  holdout_rmse: number;
}

interface PersistenceSummary {
  feature_count: number;
  total_persistence: number;
  max_persistence: number;
  mean_persistence: number;
  persistence_entropy: number;
}

interface TopologicalAnalysis {
  method: string;
  role: string;
  source: string;
  sample_size: number;
  point_count: number;
  embedding_dimension: number;
  delay: number;
  h0_connected_components: PersistenceSummary;
  h1_loops: PersistenceSummary;
  loop_strength: number;
  regime: string;
  interpretation: string;
}

interface HorizonPrediction {
  horizon_business_days: number;
  predicted_return: number;
  predicted_price: number;
  up_probability: number;
  selected_model: string;
  holdout_return_rmse: number;
  walk_forward_return_rmse: number;
}

interface ConfidenceCriteria {
  rmse_improvement_rate_min: number;
  directional_accuracy_min: number;
  rmse_stability_ratio_max: number;
  sharpe_ratio_min: number;
  strategy_must_beat_buy_and_hold: boolean;
  high_topological_complexity_allowed: boolean;
}

interface ConfidenceAssessment {
  confidence_score: number;
  confidence_level: "高" | "中" | "低";
  trade_signal: "候補" | "監視" | "見送り";
  risk_reasons: string[];
  holdout_to_walk_forward_rmse_ratio: number;
  criteria: ConfidenceCriteria;
}

interface Prediction {
  close_next: Record<string, number>;
  close_pred: Record<string, number>;
  score: number;
  target?: string;
  selected_model?: string;
  predicted_return?: number;
  up_probability?: number;
  horizon_predictions?: Record<string, HorizonPrediction>;
  confidence?: ConfidenceAssessment;
  prediction_interval?: PredictionInterval;
  model_comparison?: Record<string, ModelResult>;
  backtest?: Backtest;
  topological_analysis?: TopologicalAnalysis;
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

const regimeName = (value?: string) => {
  const names: Record<string, string> = {
    low_topological_complexity: "低いトポロジー複雑度",
    moderate_topological_complexity: "中程度のトポロジー複雑度",
    high_topological_complexity: "高いトポロジー複雑度",
  };
  return value ? names[value] ?? value : "—";
};

const formatDecimal = (value?: number, digits = 3) =>
  Number.isFinite(value) ? (value as number).toFixed(digits) : "—";

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
  const topologicalAnalysis = prediction?.topological_analysis;
  const modelComparison = Object.entries(prediction?.model_comparison ?? {});
  const horizonPredictions = Object.values(prediction?.horizon_predictions ?? {}).sort(
    (left, right) => left.horizon_business_days - right.horizon_business_days
  );
  const confidence = prediction?.confidence;

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

          <Box className="analysis-result-heading">
            <Typography component="h2" className="analysis-result-title">
              時系列交差検証による株価予測
            </Typography>
            <Typography color="text.secondary">
              過去から未来へ順番に検証したモデルで、翌営業日の収益率と終値を予測します。
            </Typography>
          </Box>

          {confidence && (
            <Paper className="analysis-confidence-panel" elevation={0}>
              <Box className="analysis-confidence-score">
                <Typography className="analysis-confidence-label">総合信頼度</Typography>
                <Typography className="analysis-confidence-number">
                  {confidence.confidence_score}
                  <small>/100</small>
                </Typography>
                <Typography className="analysis-confidence-level">
                  信頼度 {confidence.confidence_level}
                </Typography>
              </Box>
              <Box className="analysis-confidence-details">
                <Box className="analysis-confidence-summary">
                  <Box>
                    <Typography className="analysis-metric-label">1営業日後の上昇確率</Typography>
                    <Typography className="analysis-confidence-value">
                      {formatPercent(prediction.up_probability)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography className="analysis-metric-label">参考判定</Typography>
                    <Typography
                      className={`analysis-signal is-${confidence.trade_signal}`}
                    >
                      {confidence.trade_signal}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography className="analysis-metric-label">直近精度の安定比</Typography>
                    <Typography className="analysis-confidence-value">
                      {formatDecimal(confidence.holdout_to_walk_forward_rmse_ratio, 2)}倍
                    </Typography>
                  </Box>
                </Box>
                <Box className="analysis-risk-reasons">
                  <Typography className="analysis-metric-label">判定時に考慮された注意点</Typography>
                  {confidence.risk_reasons.length > 0 ? (
                    <ul>
                      {confidence.risk_reasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  ) : (
                    <Typography className="analysis-no-risk">基準を下回る注意項目はありません。</Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          )}

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

          {horizonPredictions.length > 0 && (
            <Paper className="analysis-panel" elevation={0}>
              <Typography component="h3" className="analysis-section-title">
                期間別予測
              </Typography>
              <Typography className="analysis-section-description">
                各期間は、それぞれの予測対象に合わせて時系列検証とモデル選択を行っています。
              </Typography>
              <Box className="analysis-horizon-grid">
                {horizonPredictions.map((forecast) => (
                  <Box className="analysis-horizon-card" key={forecast.horizon_business_days}>
                    <Box className="analysis-horizon-header">
                      <Typography component="h4">
                        {forecast.horizon_business_days}営業日後
                      </Typography>
                      <span>{modelName(forecast.selected_model)}</span>
                    </Box>
                    <Typography className="analysis-horizon-price">
                      {formatYen(forecast.predicted_price)}
                    </Typography>
                    <Box className="analysis-horizon-values">
                      <span>
                        予測収益率
                        <strong className={forecast.predicted_return >= 0 ? "is-positive" : "is-negative"}>
                          {formatPercent(forecast.predicted_return)}
                        </strong>
                      </span>
                      <span>
                        上昇確率
                        <strong>{formatPercent(forecast.up_probability)}</strong>
                      </span>
                      <span>
                        ホールドアウトRMSE
                        <strong>{formatPercent(forecast.holdout_return_rmse)}</strong>
                      </span>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

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

          {modelComparison.length > 0 && (
            <Paper className="analysis-panel" elevation={0}>
              <Typography component="h3" className="analysis-section-title">
                モデル比較
              </Typography>
              <Box className="analysis-model-table" role="table" aria-label="時系列交差検証モデル比較">
                <Box className="analysis-model-row is-header" role="row">
                  <span>モデル</span>
                  <span>ウォークフォワード RMSE</span>
                  <span>ホールドアウト RMSE</span>
                </Box>
                {modelComparison.map(([name, comparison]) => (
                  <Box
                    className={`analysis-model-row${name === prediction.selected_model ? " is-selected" : ""}`}
                    role="row"
                    key={name}
                  >
                    <span>
                      {modelName(name)}
                      {name === prediction.selected_model && (
                        <small className="analysis-selected-badge">採用</small>
                      )}
                    </span>
                    <span>{formatPercent(comparison.walk_forward_rmse)}</span>
                    <span>{formatPercent(comparison.holdout_rmse)}</span>
                  </Box>
                ))}
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

          {topologicalAnalysis && (
            <Paper className="analysis-panel analysis-topology-panel" elevation={0}>
              <Box className="analysis-result-heading analysis-topology-heading">
                <Typography component="h2" className="analysis-result-title">
                  トポロジカルデータ解析（TDA）
                </Typography>
                <Typography color="text.secondary">
                  日次リターンの形状から、最近の市場構造の複雑さを捉える補助分析です。
                </Typography>
              </Box>

              <Alert severity="info" className="analysis-topology-alert">
                TDAは株価の上昇・下落を予測するものではありません。時系列交差検証の価格予測とは分けて解釈してください。
              </Alert>

              <Box className="analysis-metric-grid analysis-topology-summary">
                <MetricCard
                  label="市場構造判定"
                  value={regimeName(topologicalAnalysis.regime)}
                  note="ヒューリスティック判定"
                  accent
                />
                <MetricCard
                  label="ループ強度"
                  value={formatPercent(topologicalAnalysis.loop_strength)}
                  note="H0に対するH1総永続量の比率"
                />
                <MetricCard
                  label="使用サンプル"
                  value={`${topologicalAnalysis.sample_size.toLocaleString()}日`}
                  note={`遅延埋め込み後 ${topologicalAnalysis.point_count.toLocaleString()}点`}
                />
                <MetricCard
                  label="遅延埋め込み"
                  value={`${topologicalAnalysis.embedding_dimension}次元`}
                  note={`遅延 ${topologicalAnalysis.delay}営業日`}
                />
              </Box>

              <Box className="analysis-topology-grid">
                <Box className="analysis-topology-card">
                  <Typography component="h3" className="analysis-section-title">
                    H0：連結構造
                  </Typography>
                  <Typography className="analysis-topology-description">
                    点群がどのようにまとまり、連結していくかを表します。
                  </Typography>
                  <Box className="analysis-topology-values">
                    <span>特徴数<strong>{topologicalAnalysis.h0_connected_components.feature_count.toLocaleString()}</strong></span>
                    <span>総永続量<strong>{formatDecimal(topologicalAnalysis.h0_connected_components.total_persistence)}</strong></span>
                    <span>最大永続量<strong>{formatDecimal(topologicalAnalysis.h0_connected_components.max_persistence)}</strong></span>
                    <span>平均永続量<strong>{formatDecimal(topologicalAnalysis.h0_connected_components.mean_persistence)}</strong></span>
                    <span>永続エントロピー<strong>{formatDecimal(topologicalAnalysis.h0_connected_components.persistence_entropy)}</strong></span>
                  </Box>
                </Box>

                <Box className="analysis-topology-card">
                  <Typography component="h3" className="analysis-section-title">
                    H1：循環・ループ構造
                  </Typography>
                  <Typography className="analysis-topology-description">
                    時系列の点群に現れる循環的な構造の強さを表します。
                  </Typography>
                  <Box className="analysis-topology-values">
                    <span>特徴数<strong>{topologicalAnalysis.h1_loops.feature_count.toLocaleString()}</strong></span>
                    <span>総永続量<strong>{formatDecimal(topologicalAnalysis.h1_loops.total_persistence)}</strong></span>
                    <span>最大永続量<strong>{formatDecimal(topologicalAnalysis.h1_loops.max_persistence)}</strong></span>
                    <span>平均永続量<strong>{formatDecimal(topologicalAnalysis.h1_loops.mean_persistence)}</strong></span>
                    <span>永続エントロピー<strong>{formatDecimal(topologicalAnalysis.h1_loops.persistence_entropy)}</strong></span>
                  </Box>
                </Box>
              </Box>

              <Typography className="analysis-topology-method">
                手法：Vietoris–Rips 永続ホモロジー ／ 入力：日次リターンの遅延埋め込み
              </Typography>
            </Paper>
          )}

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
