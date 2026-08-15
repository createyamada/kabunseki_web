import React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Menu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="menu-page">
      <Box className="menu-hero">
        <Typography component="h1" className="analysis-title">
          日本株分析ダッシュボード
        </Typography>
        <Typography className="analysis-subtitle">
          個別銘柄分析、ランキング、特徴量の評価履歴を目的に合わせて選択してください。
        </Typography>
      </Box>
      <Box className="menu-grid">
        <Paper className="menu-card" elevation={0}>
          <span className="menu-card-number">01</span>
          <Typography component="h2">個別銘柄分析</Typography>
          <Typography>
            銘柄コードを指定し、翌営業日の予測、期間別予測、リスク、財務、TDAを詳しく確認します。
          </Typography>
          <Button variant="contained" onClick={() => navigate("/analysis")}>
            個別分析を開く
          </Button>
        </Paper>
        <Paper className="menu-card" elevation={0}>
          <span className="menu-card-number">03</span>
          <Typography component="h2">特徴量選択モニター</Typography>
          <Typography>
            各特徴量の除外判定回数、除外率、重要度、シャドー検証の結果を一覧で確認します。
          </Typography>
          <Button variant="contained" onClick={() => navigate("/feature-selection")}>特徴量を確認</Button>
        </Paper>
        <Paper className="menu-card is-ranking" elevation={0}>
          <span className="menu-card-number">02</span>
          <Typography component="h2">プライム市場ランキング</Typography>
          <Typography>
            プライム市場の候補銘柄を横断比較し、期待値や上昇確率、財務評価をランキングで確認します。
          </Typography>
          <Button variant="contained" color="secondary" onClick={() => navigate("/ranking")}>
            ランキングを開く
          </Button>
        </Paper>
      </Box>
    </section>
  );
};

export default Menu;
