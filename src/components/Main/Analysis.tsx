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
import { useSearchParams } from "react-router-dom";
import { getAuthorizationHeaders } from "../../auth";

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
  walk_forward_rmse?: number;
  fold_scores?: number[];
  holdout_rmse: number;
  global_weight?: number;
}

interface HybridModel {
  available: boolean;
  reason?: string;
  method?: string;
  stock_specific_model?: string;
  global_weight?: number;
  stock_specific_weight?: number;
  local_holdout_rmse?: number;
  global_holdout_rmse?: number;
  sector_correction?: number;
  global_model_used?: boolean;
  global_model?: {
    model_version: string;
    market_date: string;
    selected_model: string;
    validation_rmse: number;
    validation_rank_ic?: number;
    training_rows: number;
    stock_count: number;
    sector_count: number;
  };
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

interface DirectionClassifier {
  available: boolean;
  reason?: string;
  model?: string;
  calibration_method?: string;
  up_probability?: number;
  raw_up_probability?: number;
  brier_score?: number;
  log_loss?: number;
  directional_accuracy?: number;
  test_samples?: number;
}

interface ReturnRisk {
  available: boolean;
  expected_return_after_cost?: number;
  loss_probability?: number;
  gain_probability?: number;
  average_gain?: number;
  average_loss?: number;
  reward_risk_ratio?: number | null;
  expected_shortfall_10pct?: number;
  distribution_quantiles?: Record<string, number>;
}

interface RelativePrediction {
  available: boolean;
  reason?: string;
  predicted_excess_return?: number;
  selected_model?: string;
  holdout_rmse?: number;
  directional_accuracy?: number;
  up_probability?: number;
}

interface IndustryRelativeStrength {
  available: boolean;
  benchmark_symbol?: string | null;
  sector_name?: string | null;
  benchmark_source?: string | null;
  relative_strength_20d?: number | null;
}

interface TopologyMultiWindow {
  windows: Record<string, TopologicalAnalysis & {
    previous_loop_strength: number;
    loop_strength_change: number;
    loop_strength_change_rate: number;
  }>;
  trend: string;
  mean_loop_strength_change: number | null;
}

interface FundamentalAssessment {
  score: number | null;
  data_coverage: number;
  evaluated_checks: number;
  interpretation: string;
}

interface FundamentalAnalysis {
  available: boolean;
  source: string;
  reason?: string;
  document_type?: string;
  published_at?: string;
  point_in_time_ready?: boolean;
  metrics?: Record<string, number>;
  assessment?: FundamentalAssessment;
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
  direction_classifier?: DirectionClassifier;
  return_risk?: ReturnRisk;
  topix_excess_return_prediction?: RelativePrediction;
  industry_relative_strength?: IndustryRelativeStrength;
  horizon_predictions?: Record<string, HorizonPrediction>;
  confidence?: ConfidenceAssessment;
  prediction_interval?: PredictionInterval;
  model_comparison?: Record<string, ModelResult>;
  backtest?: Backtest;
  topological_analysis?: TopologicalAnalysis | null;
  topological_analysis_multi_window?: TopologyMultiWindow | null;
  fundamental_analysis?: FundamentalAnalysis;
  metrics?: Metrics;
  hybrid_model?: HybridModel;
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

const compactYenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  notation: "compact",
  maximumFractionDigits: 2,
});

const formatCompactYen = (value?: number) =>
  Number.isFinite(value) ? compactYenFormatter.format(value as number) : "—";

const fundamentalLabels: Record<string, string> = {
  revenue: "売上高",
  operating_income: "営業利益",
  ordinary_income: "経常利益",
  net_income: "当期純利益",
  total_assets: "総資産",
  equity: "純資産",
  operating_cash_flow: "営業CF",
  free_cash_flow: "フリーCF",
  eps: "EPS",
  operating_margin: "営業利益率",
  net_margin: "純利益率",
  equity_ratio: "自己資本比率",
  revenue_growth: "売上成長率",
  operating_income_growth: "営業利益成長率",
  net_income_growth: "純利益成長率",
  eps_growth: "EPS成長率",
};

const formatFundamental = (name: string, value: number) => {
  if (name.includes("margin") || name.includes("ratio") || name.includes("growth")) {
    return formatPercent(value);
  }
  if (name === "eps") return formatYen(value);
  return formatCompactYen(value);
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
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("code")?.replace(/\D/g, "").slice(0, 4) ?? "");
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
        { params: { code: normalizedCode }, headers: getAuthorizationHeaders() }
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
  const topologyMultiWindow = prediction?.topological_analysis_multi_window;
  const directionClassifier = prediction?.direction_classifier;
  const returnRisk = prediction?.return_risk;
  const relativePrediction = prediction?.topix_excess_return_prediction;
  const industryStrength = prediction?.industry_relative_strength;
  const fundamentals = prediction?.fundamental_analysis;
  const modelComparison = Object.entries(prediction?.model_comparison ?? {});
  const horizonPredictions = Object.values(prediction?.horizon_predictions ?? {}).sort(
    (left, right) => left.horizon_business_days - right.horizon_business_days
  );
  const confidence = prediction?.confidence;
  const hybridModel = prediction?.hybrid_model;

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

          {hybridModel?.available && (
            <Paper className="analysis-panel analysis-hybrid-panel" elevation={0}>
              <Typography component="h3" className="analysis-section-title">
                予測モデルの根拠
              </Typography>
              <Typography className="analysis-section-description">
                銘柄固有の値動きと市場全体・業種の傾向を、直近の検証誤差に応じて組み合わせています。
              </Typography>
              <Box className="analysis-hybrid-weights">
                <Box style={{ width: `${(hybridModel.stock_specific_weight ?? 1) * 100}%` }}>
                  銘柄固有 {formatPercent(hybridModel.stock_specific_weight)}
                </Box>
                {(hybridModel.global_weight ?? 0) > 0 && (
                  <Box style={{ width: `${(hybridModel.global_weight ?? 0) * 100}%` }}>
                    市場・業種 {formatPercent(hybridModel.global_weight)}
                  </Box>
                )}
              </Box>
              <Box className="analysis-detail-grid">
                <MetricCard
                  label="銘柄別モデルの検証誤差"
                  value={formatPercent(hybridModel.local_holdout_rmse)}
                  note={modelName(hybridModel.stock_specific_model)}
                />
                <MetricCard
                  label="市場共通モデルの検証誤差"
                  value={formatPercent(hybridModel.global_holdout_rmse)}
                  note={hybridModel.global_model_used ? "最終予測に採用" : "精度基準により不採用"}
                />
                <MetricCard
                  label="業種補正"
                  value={formatPercent(hybridModel.sector_correction)}
                  note="同業種の残差傾向による補正"
                />
                <MetricCard
                  label="共通モデル学習規模"
                  value={`${(hybridModel.global_model?.stock_count ?? 0).toLocaleString()}銘柄`}
                  note={`${(hybridModel.global_model?.training_rows ?? 0).toLocaleString()}件・${hybridModel.global_model?.market_date ?? "—"}時点`}
                />
              </Box>
            </Paper>
          )}

          {(directionClassifier?.available || returnRisk?.available) && (
            <Paper className="analysis-panel analysis-risk-panel" elevation={0}>
              <Typography component="h3" className="analysis-section-title">
                方向予測とリスク分布
              </Typography>
              <Typography className="analysis-section-description">
                回帰による価格予測とは別に、上昇確率を校正した分類器と予測残差から損失リスクを評価します。
              </Typography>
              <Box className="analysis-detail-grid">
                <MetricCard
                  label="校正済み上昇確率"
                  value={formatPercent(directionClassifier?.up_probability)}
                  note={directionClassifier?.available ? "時系列順Isotonic校正" : "評価不可"}
                  accent
                />
                <MetricCard
                  label="方向分類の一致率"
                  value={formatPercent(directionClassifier?.directional_accuracy)}
                  note={`${directionClassifier?.test_samples ?? 0}件で評価`}
                />
                <MetricCard
                  label="損失確率"
                  value={formatPercent(returnRisk?.loss_probability)}
                  note={`利益確率 ${formatPercent(returnRisk?.gain_probability)}`}
                />
                <MetricCard
                  label="コスト控除後期待収益率"
                  value={formatPercent(returnRisk?.expected_return_after_cost)}
                  note="取引コストとスリッページ控除後"
                />
                <MetricCard
                  label="リワード／リスク"
                  value={formatDecimal(returnRisk?.reward_risk_ratio ?? undefined, 2)}
                  note={`平均利益 ${formatPercent(returnRisk?.average_gain)} ／ 平均損失 ${formatPercent(returnRisk?.average_loss)}`}
                />
                <MetricCard
                  label="下位10%期待損失"
                  value={formatPercent(returnRisk?.expected_shortfall_10pct)}
                  note="厳しいケースの平均収益率"
                />
                <MetricCard
                  label="分類器 Brier score"
                  value={formatDecimal(directionClassifier?.brier_score, 3)}
                  note="0に近いほど確率予測が良好"
                />
                <MetricCard
                  label="分類器 Log loss"
                  value={formatDecimal(directionClassifier?.log_loss, 3)}
                  note="確信を伴う誤予測を強く評価"
                />
              </Box>
            </Paper>
          )}

          {(relativePrediction || industryStrength) && (
            <Paper className="analysis-panel" elevation={0}>
              <Typography component="h3" className="analysis-section-title">
                市場・業種との相対評価
              </Typography>
              <Typography className="analysis-section-description">
                株価の絶対的な騰落とは別に、TOPIXや同業種指数を上回る可能性を確認します。
              </Typography>
              <Box className="analysis-detail-grid">
                <MetricCard
                  label="TOPIX超過収益率予測"
                  value={relativePrediction?.available ? formatPercent(relativePrediction.predicted_excess_return) : "—"}
                  note={relativePrediction?.available ? modelName(relativePrediction.selected_model) : "評価データ不足"}
                />
                <MetricCard
                  label="TOPIX超過方向一致率"
                  value={relativePrediction?.available ? formatPercent(relativePrediction.directional_accuracy) : "—"}
                  note={`超過確率 ${formatPercent(relativePrediction?.up_probability)}`}
                />
                <MetricCard
                  label="20日業種相対強度"
                  value={industryStrength?.available ? formatPercent(industryStrength.relative_strength_20d ?? undefined) : "—"}
                  note={industryStrength?.sector_name ?? "業種ベンチマークなし"}
                />
                <MetricCard
                  label="業種ベンチマーク"
                  value={industryStrength?.benchmark_symbol ?? "—"}
                  note={industryStrength?.benchmark_source ?? undefined}
                />
              </Box>
            </Paper>
          )}

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

          {fundamentals && (
            <Paper className="analysis-panel analysis-fundamental-panel" elevation={0}>
              <Box className="analysis-result-heading analysis-fundamental-heading">
                <Typography component="h2" className="analysis-result-title">
                  EDINET財務分析
                </Typography>
                <Typography color="text.secondary">
                  公表日時を基準に取得した開示書類から、企業の収益性・財務健全性を確認します。
                </Typography>
              </Box>
              {fundamentals.available && fundamentals.metrics && fundamentals.assessment ? (
                <>
                  <Box className="analysis-metric-grid analysis-fundamental-summary">
                    <MetricCard
                      label="財務チェック"
                      value={fundamentals.assessment.score != null ? `${fundamentals.assessment.score}/100` : "—"}
                      note={`${fundamentals.assessment.evaluated_checks}項目を評価`}
                      accent
                    />
                    <MetricCard
                      label="データカバレッジ"
                      value={formatPercent(fundamentals.assessment.data_coverage)}
                      note="取得可能項目の割合"
                    />
                    <MetricCard
                      label="開示日時"
                      value={fundamentals.published_at ? new Date(fundamentals.published_at).toLocaleDateString("ja-JP") : "—"}
                      note={fundamentals.document_type}
                    />
                    <MetricCard
                      label="データソース"
                      value="EDINET"
                      note="公表時点管理済み"
                    />
                  </Box>
                  <Box className="analysis-fundamental-grid">
                    {Object.entries(fundamentals.metrics).map(([name, value]) => (
                      <Box className="analysis-fundamental-item" key={name}>
                        <span>{fundamentalLabels[name] ?? name}</span>
                        <strong>{formatFundamental(name, value)}</strong>
                      </Box>
                    ))}
                  </Box>
                  <Typography className="analysis-topology-method">
                    財務スコアは取得できた項目だけを用いた簡易評価で、株価の割安・割高を直接示すものではありません。
                  </Typography>
                </>
              ) : (
                <Alert severity="info" className="analysis-topology-alert">
                  EDINET財務分析を利用できません（{fundamentals.reason ?? "データ未取得"}）。株価予測は財務分析なしで計算されています。
                </Alert>
              )}
            </Paper>
          )}

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

              {topologyMultiWindow && Object.keys(topologyMultiWindow.windows).length > 0 && (
                <Box className="analysis-topology-window-section">
                  <Typography component="h3" className="analysis-section-title">
                    期間別の複雑度変化
                  </Typography>
                  <Box className="analysis-topology-window-grid">
                    {Object.entries(topologyMultiWindow.windows).map(([window, value]) => (
                      <Box className="analysis-topology-window-card" key={window}>
                        <strong>{window}営業日</strong>
                        <span>ループ強度 {formatPercent(value.loop_strength)}</span>
                        <span className={value.loop_strength_change_rate > 0 ? "is-negative" : "is-positive"}>
                          前期間比 {formatPercent(value.loop_strength_change_rate)}
                        </span>
                        <small>{regimeName(value.regime)}</small>
                      </Box>
                    ))}
                  </Box>
                  <Typography className="analysis-topology-description">
                    複雑度トレンド：{topologyMultiWindow.trend === "increasing_complexity" ? "上昇" : "低下または安定"}
                  </Typography>
                </Box>
              )}

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
