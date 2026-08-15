import React from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

// コンポーネントの型定義
interface ComponentProps {
  className?: string;
}

const Header: React.FC<ComponentProps> = ({ className }) => {
  // ***********************************************
  // *
  // *  定数宣言
  // *
  // ***********************************************
  // 画面遷移の設定
  const navigate = useNavigate();

  // ***********************************************
  // *
  // *  イベント
  // *
  // ***********************************************
  //ログイン押下時のイベントメソッド
  const topLogoClick = () => {
    //登録後トークン認証画面を開く
    navigate("/");
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            onClick={topLogoClick}
            component="div"
            sx={{ flexGrow: 1 }}
          >
            KABUNSEKI-WEB
          </Typography>
          <Button color="inherit" onClick={() => navigate("/analysis")}>個別分析</Button>
          <Button color="inherit" onClick={() => navigate("/ranking")}>ランキング</Button>
          <Button color="inherit" onClick={() => navigate("/feature-selection")}>特徴量</Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
