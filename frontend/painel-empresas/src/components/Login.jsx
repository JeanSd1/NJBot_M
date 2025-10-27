import { useState } from 'react';
import styled from 'styled-components';
import { login } from '../services/loginService';
// import logo from "../img/NJBot_original.jpg";

const Container = styled.div`
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at bottom, rgba(10,10,20,0.8), rgba(2,6,23,1) 60%);
`;

const Card = styled.div`
  width: 100%;
  max-width: 980px;
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 30px 60px rgba(2,6,23,0.6);
`;

const Left = styled.div`
  flex: 1 1 420px;
  padding: 48px 48px 56px 48px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(12,12,20,0.6));
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Right = styled.div`
  flex: 1 1 420px;
  background: #181a20;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Input = styled.input`
  padding: 0.95rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  font-size: 0.95rem;
  background: rgba(255,255,255,0.02);
  color: #fff;
  outline: none;
  transition: box-shadow 0.18s, border-color 0.18s;

  &::placeholder { color: rgba(255,255,255,0.55); }
  &:focus {
    box-shadow: 0 6px 30px rgba(142, 80, 255, 0.18), 0 0 0 6px rgba(142,80,255,0.06);
    border-color: rgba(142,80,255,0.9);
  }
`;

const Button = styled.button`
  padding: 0.95rem;
  background: linear-gradient(90deg,#ff6ec7,#ffd56b);
  color: #0b1220;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(255,110,199,0.12);
  transition: transform .12s ease, box-shadow .12s ease;

  &:hover { transform: translateY(-2px); }
`;

const ErrorMessage = styled.p`
  color: #ff6b6b;
  margin-top: 1rem;
  text-align: center;
  font-weight: bold;
`;

const Img = styled.img`
  height: 40px;
  width: 40px;
  margin-bottom: 20px;
  border-radius: 30%;
  align-self: center;
`;

const NJBot = styled.div`
  font-size: 2.1rem;
  font-weight: 800;
  display: flex;
  gap: .25rem;
  align-items: center;
  margin-bottom: 18px;
`;

const Letter = styled.span`
  color: ${props => props.color};
  animation: ${props => props.animate ? colorShift : 'none'} 7s infinite ease-in-out;
  font-family: 'Montserrat', sans-serif;
`

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, senha);
      window.location.href = '/dashboard';
    } catch (errMsg) {
      setErro(errMsg);
    }
  };

  return (
    <Container>
      <Card>
        <Left>
          <NJBot>
            <Letter color="#EDE7FF">N</Letter>
            <Letter color="#C6B6FF">J</Letter>
            <Letter color="#FF83C0">B</Letter>
            <Letter color="#FF83C0">ot</Letter>
          </NJBot>

          <h2 style={{ fontSize: '1.8rem', margin: 0, marginBottom: '8px' }}>Faça seu login.</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6, marginBottom: 18 }}>Acesse o painel de controle do NJBot</p>

          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <Input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="Senha"
            required
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'underline', fontSize: '0.9rem' }}>Esqueci minha senha</a>
          </div>

          <div style={{ marginTop: 18 }}>
            <Button type="submit" onClick={handleLogin}>Entrar</Button>
          </div>

          {erro && <ErrorMessage>{erro}</ErrorMessage>}
          <div style={{ marginTop: 12, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Ainda não tenho uma conta</a>
          </div>
        </Left>

        <Right>
          <img src={require('../img/logo-njbot.png')} alt="Logo NJBot" style={{ maxWidth: '80%', maxHeight: '70%', borderRadius: '50%', boxShadow: '0 0 40px #0ff2, 0 0 0 8px #181a20' }} />
        </Right>
      </Card>
    </Container>
  );
}
