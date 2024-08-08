import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Container, Paper, Button } from "@mui/material";

const CreateUser: React.FC = () => {
  // ***********************************************
  // *
  // *  定数宣言
  // *
  // ***********************************************
  // 画面遷移の設定
  // const navigate = useNavigate();
  //Paperタグ内のスタイリングの変数
  const paperStyle = { padding: "50px 20px", width: 600, margin: "20px auto" };

  //UseStateの変数
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ***********************************************
  // *
  // *  イベント
  // *
  // ***********************************************
  //登録ボタン押下時のイベントメソッド
  const registerButtonClick = () => {
    const user = { username, password };

    //サーバーにURLを投げる処理
    fetch("http://localhost:8080/user/register", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization':'Bearer ' + jwt.access_token
      },
      body: JSON.stringify(user),
    }).then(() => {
      console.log("New User Added");
      setUsername(username);
    });

    //登録後トークン認証画面を開く
    // navigate('/TokenComplete');
  };

  // ***********************************************
  // *
  // *  ReturnDOM
  // *
  // ***********************************************
  return (
    <Container>
      <Paper elevation={3} style={paperStyle}>
        <h1 style={{ color: "blue" }}>
          <u>Create User</u>
        </h1>

        <Box
          component="form"
          sx={{
            "& > :not(style)": { m: 1 },
          }}
          noValidate
          autoComplete="off"
        >
          {/* メールアドレステキストボックス */}
          <TextField
            id="standard-basic"
            label="Username"
            variant="standard"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* パスワードテキストボックス */}
          <TextField
            id="standard-basic"
            label="Password"
            variant="standard"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button variant="contained" onClick={registerButtonClick}>
            Resister
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateUser;
