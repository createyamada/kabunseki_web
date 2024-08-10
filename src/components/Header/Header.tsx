import React from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

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
  const loginButtonClick = () => {
    //登録後トークン認証画面を開く
    navigate("/login");
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            KABUNSEKI-WEB
          </Typography>
          <Button color="inherit" onClick={loginButtonClick}>
            Login
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
