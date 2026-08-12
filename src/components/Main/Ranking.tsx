import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthorizationHeaders } from "../../auth";

interface RankingItem {
  rank: number;
  code: string;
  company?: string | null;
  company_name?: string | null;
  name?: string | null;
  sector?: string;
  total_score: number;
  trade_signal?: string;
  predicted_return_5d?: number | null;
  up_probability_5d?: number | null;
  predicted_excess_return?: number | null;
  expected_value?: number | null;
  loss_probability?: number | null;
  reward_risk_ratio?: number | null;
  confidence_score?: number | null;
  fundamental_score?: number | null;
  fundamental_data_coverage?: number | null;
  topological_regime?: string;
  global_predicted_return?: number | null;
  global_model_rank?: number | null;
  expected_rank?: number | null;
  probability_rank?: number | null;
  excess_rank?: number | null;
  reward_risk_rank?: number | null;
  loss_safety_rank?: number | null;
  confidence_rank?: number | null;
  screening_rank?: number | null;
  fundamental_rank?: number | null;
  positive_factors?: string[];
  risk_factors?: string[];
}

interface RankingResponse {
  available: boolean;
  reason?: string;
  generated_at?: string | null;
  source?: string;
  universe_count?: number | null;
  analyzed_count?: number | null;
  ranking: RankingItem[];
}

interface RankingStatus {
  status: "not_started" | "queued" | "running" | "completed" | "failed" | "already_running";
  latest_csv_exists?: boolean;
  started_at?: string;
  completed_at?: string;
  universe_count?: number;
  screening_count?: number;
  analyzed_count?: number;
  failed_count?: number;
  processed_count?: number;
  total_count?: number;
  phase?: string;
  phase_label?: string;
  progress_percent?: number;
  elapsed_seconds?: number;
  estimated_remaining_seconds?: number | null;
  estimated_completion_at?: string | null;
  current_code?: string;
  current_company?: string;
  error?: string;
}

const companyName = (item: RankingItem) =>
  item.company?.trim() || item.company_name?.trim() || item.name?.trim() || `銘柄 ${item.code}`;

const formatPercent = (value?: number | null) =>
  Number.isFinite(value) ? `${((value as number) * 100).toFixed(2)}%` : "—";

const formatRank = (value?: number | null) =>
  Number.isFinite(value) ? `上位 ${Math.max(1, Math.round((1 - (value as number)) * 100))}%` : "—";

const regimeName = (value?: string) => ({
  low_topological_complexity: "低",
  moderate_topological_complexity: "中",
  high_topological_complexity: "高",
}[value ?? ""] ?? "—");

const Ranking: React.FC = () => {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [status, setStatus] = useState<RankingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.REACT_APP_KABUMMIKE_URL;

  const loadRanking = useCallback(async () => {
    const response = await axios.get<RankingResponse>(`${apiBase}/api/prime-ranking/`, {
      params: { limit: 10 },
      headers: getAuthorizationHeaders(),
    });
    setRanking(response.data);
  }, [apiBase]);

  const loadStatus = useCallback(async () => {
    const response = await axios.get<RankingStatus>(`${apiBase}/api/prime-ranking/status`, {
      headers: getAuthorizationHeaders(),
    });
    setStatus(response.data);
    return response.data;
  }, [apiBase]);

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await Promise.all([loadRanking(), loadStatus()]);
      } catch (requestError: any) {
        setError(requestError.response?.data?.detail ?? "ランキングを取得できませんでした。");
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [loadRanking, loadStatus]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await axios.post<RankingStatus>(`${apiBase}/api/prime-ranking/refresh`, null, {
        params: { limit: 10, shortlist_size: 50 },
        headers: getAuthorizationHeaders(),
      });
      setStatus(response.data);
    } catch (requestError: any) {
      setRefreshing(false);
      setError(requestError.response?.data?.detail ?? "ランキング更新を開始できませんでした。");
    }
  };

  const isRunning = refreshing || status?.status === "queued" || status?.status === "running" || status?.status === "already_running";

  return (
    <section className="ranking-page">
      <Box className="ranking-header">
        <Box>
          <Typography component="h1" className="analysis-title">プライム市場ランキング</Typography>
          <Typography className="analysis-subtitle">
            市場スクリーニングと個別高度分析を組み合わせた参考ランキングです。
          </Typography>
        </Box>
        <Button variant="contained" disabled={isRunning} onClick={handleRefresh}>
          {isRunning ? <><CircularProgress size={18} color="inherit" /> 分析中</> : "ランキングを更新"}
        </Button>
      </Box>

      {status && (
        <Paper className="ranking-status" elevation={0}>
          <Box className="ranking-status-heading">
            <span className={`ranking-status-dot is-${status.status}`} />
            <Box>
              <strong>{isRunning ? status.phase_label ?? "ランキングを生成しています" : status.status === "failed" ? "生成に失敗しました" : "最新ランキング"}</strong>
              <small>
                {isRunning
                  ? `処理済み ${status.processed_count ?? 0} / ${status.total_count ?? "—"}件（成功 ${status.analyzed_count ?? 0}・失敗 ${status.failed_count ?? 0}）${status.current_code ? `｜現在 ${status.current_company ? `${status.current_company}（${status.current_code}）` : status.current_code}` : ""}`
                  : ranking?.generated_at
                    ? `生成日時 ${new Date(ranking.generated_at).toLocaleString("ja-JP")}`
                    : "まだランキングが生成されていません"}
              </small>
            </Box>
            {isRunning && <CircularProgress size={24} />}
          </Box>
          {isRunning && (
            <>
              <Alert severity="info" className="ranking-concurrent-note">
                ランキングを生成しています。画面を再表示したときに最新の処理状態を確認します。
              </Alert>
              <Alert severity="info" className="ranking-concurrent-note" action={<Button color="inherit" onClick={() => navigate("/analysis")}>個別分析を開く</Button>}>
                ランキング生成中も個別銘柄の分析を利用できます。
              </Alert>
            </>
          )}
        </Paper>
      )}

      {error && <Alert severity="error" className="ranking-alert">{error}</Alert>}

      {loading ? (
        <Box className="ranking-loading"><CircularProgress /><Typography>ランキングを読み込んでいます</Typography></Box>
      ) : ranking?.available && ranking.ranking.length > 0 ? (
        <TableContainer component={Paper} className="ranking-table" elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>順位</TableCell>
                <TableCell>銘柄</TableCell>
                <TableCell align="right">総合スコア</TableCell>
                <TableCell align="right">共通モデル</TableCell>
                <TableCell align="right">5日予測</TableCell>
                <TableCell align="right">上昇確率</TableCell>
                <TableCell align="right">期待値</TableCell>
                <TableCell align="right">損失確率</TableCell>
                <TableCell>評価</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ranking.ranking.map((item) => (
                <TableRow key={item.code} hover>
                  <TableCell><span className={`ranking-rank is-${item.rank}`}>{item.rank}</span></TableCell>
                  <TableCell>
                    <button className="ranking-company" onClick={() => navigate(`/analysis?code=${item.code}`)}>
                      <strong>{companyName(item)}</strong>
                      <span>{item.code}・{item.sector ?? "業種不明"}</span>
                    </button>
                    <Box className="ranking-factors">
                      {item.positive_factors?.map((factor) => <small className="is-positive" key={factor}>＋ {factor}</small>)}
                      {item.risk_factors?.map((factor) => <small className="is-risk" key={factor}>△ {factor}</small>)}
                    </Box>
                  </TableCell>
                  <TableCell align="right"><strong className="ranking-score">{item.total_score.toFixed(1)}</strong></TableCell>
                  <TableCell align="right" className={(item.global_predicted_return ?? 0) >= 0 ? "value-positive" : "value-negative"}>
                    <strong>{formatPercent(item.global_predicted_return)}</strong>
                    <small className="ranking-submetric">{formatRank(item.global_model_rank)}</small>
                  </TableCell>
                  <TableCell align="right" className={(item.predicted_return_5d ?? 0) >= 0 ? "value-positive" : "value-negative"}>{formatPercent(item.predicted_return_5d)}</TableCell>
                  <TableCell align="right">{formatPercent(item.up_probability_5d)}</TableCell>
                  <TableCell align="right" className={(item.expected_value ?? 0) >= 0 ? "value-positive" : "value-negative"}>{formatPercent(item.expected_value)}</TableCell>
                  <TableCell align="right">{formatPercent(item.loss_probability)}</TableCell>
                  <TableCell>
                    <span className={`ranking-signal is-${item.trade_signal}`}>{item.trade_signal ?? "—"}</span>
                    <small className="ranking-submetric">健全性 {item.confidence_score ?? "—"} / 財務 {item.fundamental_score ?? "—"} / TDA {regimeName(item.topological_regime)}</small>
                    <Box className="ranking-evidence" aria-label="ランキング根拠">
                      <span>期待値 {formatRank(item.expected_rank)}</span>
                      <span>上昇確率 {formatRank(item.probability_rank)}</span>
                      <span>超過収益 {formatRank(item.excess_rank)}</span>
                      <span>損失耐性 {formatRank(item.loss_safety_rank)}</span>
                      <span>リスクリワード {formatRank(item.reward_risk_rank)}</span>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" className="ranking-alert">
          ランキングはまだありません。「ランキングを更新」から生成を開始してください。完了まで数分かかる場合があります。
        </Alert>
      )}

      <Alert severity="warning" variant="outlined" className="ranking-alert">
        本ランキングは投資推奨ではありません。スコアは複数の統計指標をまとめた参考値です。銘柄名を選択すると個別分析を確認できます。
      </Alert>
    </section>
  );
};

export default Ranking;
