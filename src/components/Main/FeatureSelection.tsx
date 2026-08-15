import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Alert, Box, Chip, CircularProgress, FormControl, InputLabel, MenuItem,
  Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography,
} from "@mui/material";
import { getAuthorizationHeaders } from "../../auth";

type FeatureRow = {
  feature: string;
  group: string;
  status: string;
  evaluated_count: number;
  exclusion_count: number;
  exclusion_rate: number;
  mean_importance: number;
  median_importance: number;
  distinct_stocks: number;
  distinct_sectors: number;
  latest_date: string;
  shadow_evaluations: number;
  shadow_noninferior_rate: number;
};

type Dashboard = {
  features: FeatureRow[];
  summary: { feature_count: number; event_count: number; status_counts: Record<string, number> };
  criteria: { candidate: string; removed: string };
};

const statusLabels: Record<string, string> = {
  active: "有効", monitoring: "監視中", exclusion_candidate: "除外候補",
  shadow_excluded: "シャドー検証", removed: "除外済み",
};

const FeatureSelection: React.FC = () => {
  const [data, setData] = useState<Dashboard | null>(null);
  const [status, setStatus] = useState("");
  const [minimum, setMinimum] = useState(0);
  const [code, setCode] = useState("");
  const [sector, setSector] = useState("");
  const [model, setModel] = useState("");
  const [horizon, setHorizon] = useState("");
  const [regime, setRegime] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const apiBase = process.env.REACT_APP_KABUMMIKE_URL;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<Dashboard>(`${apiBase}/api/feature-selection/`, {
        params: {
          status: status || undefined, minimum_evaluations: minimum,
          code: code || undefined, sector: sector || undefined, model: model || undefined,
          horizon: horizon || undefined, regime: regime || undefined,
        },
        headers: getAuthorizationHeaders(),
      });
      setData(response.data);
      setError("");
    } catch (requestError) {
      setError("特徴量の評価履歴を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, [apiBase, code, horizon, minimum, model, regime, sector, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <section className="feature-selection-page">
      <Box className="ranking-header">
        <Box>
          <Typography component="h1" className="analysis-title">特徴量選択モニター</Typography>
          <Typography className="analysis-subtitle">
            Permutation Importanceの反復評価と、除外候補のシャドー検証状況を確認できます。
          </Typography>
        </Box>
      </Box>
      <Alert severity="info" className="ranking-alert">
        重要度が一度マイナスになっただけでは除外しません。複数銘柄・業種で30回評価し、さらにシャドーモデルで非劣性を20回確認した項目だけを自動除外します。
      </Alert>
      <Paper className="feature-selection-summary" elevation={0}>
        <span>評価イベント <strong>{data?.summary.event_count ?? 0}</strong></span>
        <span>特徴量 <strong>{data?.summary.feature_count ?? 0}</strong></span>
        <span>除外候補 <strong>{data?.summary.status_counts.exclusion_candidate ?? 0}</strong></span>
        <span>除外済み <strong>{data?.summary.status_counts.removed ?? 0}</strong></span>
      </Paper>
      <Box className="feature-selection-filters">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>状態</InputLabel>
          <Select value={status} label="状態" onChange={(event) => setStatus(event.target.value)}>
            <MenuItem value="">すべて</MenuItem>
            {Object.entries(statusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="最低評価回数" type="number" value={minimum}
          inputProps={{ min: 0 }} onChange={(event) => setMinimum(Math.max(0, Number(event.target.value)))} />
        <TextField size="small" label="銘柄コード" value={code} onChange={(event) => setCode(event.target.value)} />
        <TextField size="small" label="業種" value={sector} onChange={(event) => setSector(event.target.value)} />
        <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>モデル</InputLabel>
          <Select value={model} label="モデル" onChange={(event) => setModel(event.target.value)}>
            <MenuItem value="">すべて</MenuItem><MenuItem value="linear_regression">線形回帰</MenuItem>
            <MenuItem value="ridge">Ridge</MenuItem><MenuItem value="gradient_boosting">勾配ブースティング</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>予測期間</InputLabel>
          <Select value={horizon} label="予測期間" onChange={(event) => setHorizon(event.target.value)}>
            <MenuItem value="">すべて</MenuItem><MenuItem value="1">1営業日</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>相場局面</InputLabel>
          <Select value={regime} label="相場局面" onChange={(event) => setRegime(event.target.value)}>
            <MenuItem value="">すべて</MenuItem><MenuItem value="low_volatility">低ボラ</MenuItem>
            <MenuItem value="normal_volatility">通常</MenuItem><MenuItem value="high_volatility">高ボラ</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <Box className="ranking-loading"><CircularProgress /><Typography>評価履歴を読み込んでいます</Typography></Box> :
        <TableContainer component={Paper} elevation={0} className="feature-selection-table">
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>特徴量 / グループ</TableCell><TableCell>状態</TableCell>
              <TableCell align="right">評価</TableCell><TableCell align="right">除外判定</TableCell>
              <TableCell align="right">除外率</TableCell><TableCell align="right">平均 / 中央重要度</TableCell>
              <TableCell align="right">銘柄 / 業種</TableCell><TableCell align="right">シャドー非劣性</TableCell>
              <TableCell>最終評価日</TableCell>
            </TableRow></TableHead>
            <TableBody>{data?.features.map((row) => <TableRow key={row.feature}>
              <TableCell><strong>{row.feature}</strong><small>{row.group}</small></TableCell>
              <TableCell><Chip size="small" label={statusLabels[row.status] ?? row.status} className={`feature-status is-${row.status}`} /></TableCell>
              <TableCell align="right">{row.evaluated_count}</TableCell><TableCell align="right">{row.exclusion_count}</TableCell>
              <TableCell align="right">{(row.exclusion_rate * 100).toFixed(1)}%</TableCell>
              <TableCell align="right">{row.mean_importance.toExponential(2)} / {row.median_importance.toExponential(2)}</TableCell>
              <TableCell align="right">{row.distinct_stocks} / {row.distinct_sectors}</TableCell>
              <TableCell align="right">{row.shadow_evaluations ? `${(row.shadow_noninferior_rate * 100).toFixed(1)}% (${row.shadow_evaluations})` : "—"}</TableCell>
              <TableCell>{row.latest_date}</TableCell>
            </TableRow>)}</TableBody>
          </Table>
        </TableContainer>}
      {!loading && !data?.features.length && <Alert severity="warning">評価データはまだありません。個別分析またはランキング分析を実行すると蓄積されます。</Alert>}
    </section>
  );
};

export default FeatureSelection;
