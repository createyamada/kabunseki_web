import React, { FormEvent, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Container, IconButton, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { setAccessToken } from "../../auth";

type LoginResponse = { access_token: string; token_type: "bearer"; expires_at: string };

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiBase = process.env.REACT_APP_KABUMMIKE_URL;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await axios.post<LoginResponse>(`${apiBase}/api/auth/login`, { password });
      setAccessToken(response.data.access_token);
      const destination = (location.state as { from?: string } | null)?.from || "/";
      navigate(destination, { replace: true });
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
        setError("パスワードが正しくありません。");
      } else {
        setError("ログイン処理に失敗しました。APIサーバーの設定を確認してください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 10, p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={700} gutterBottom>株式分析システム</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>閲覧するにはサイトパスワードを入力してください。</Typography>
        <Box component="form" onSubmit={submit}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus fullWidth required label="パスワード"
            type={showPassword ? "text" : "password"} value={password}
            autoComplete="current-password" onChange={(event) => setPassword(event.target.value)}
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"} onClick={() => setShowPassword((value) => !value)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ) }}
          />
          <Button fullWidth type="submit" variant="contained" size="large" disabled={!password || loading} sx={{ mt: 3 }}>
            {loading ? "確認中…" : "ログイン"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
