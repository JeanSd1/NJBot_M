import React, { useState } from 'react';
import styled from 'styled-components';

import { login } from '../services/loginService';

const Container = styled.div`
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #000066 0%, #000066 40%, #770b22ff 100%);
  position: relative;
  overflow: hidden;
`;

const Card = styled.div`
  width: 100%;
  max-width: 1100px;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 0 30px rgba(0, 132, 255, 0.1);
  position: relative;
  z-index: 1;
`;

const Left = styled.div`
  flex: 1 1 420px;
  padding: 40px;
  background: #121212;
  color: #f1e7e7ff;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Right = styled.div`
  flex: 1 1 520px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 440px;
  position: relative;
  overflow: hidden;
`;

const SmallTitle = styled.div`
  font-size: 28px;
  font-weight: 900;
  color: #ffffff;
  -webkit-text-fill-color: #ffffff;
  letter-spacing: 0.6px;
`;

const Heading = styled.h2`
  font-size: 1.8rem;
  margin: 0;
  margin-bottom: 8px;
  color: #ffffff;
`;

const Hint = styled.p`
  color: rgba(238, 233, 233, 0.6);
  margin-top: 6px;
  margin-bottom: 18px;
`;

const Field = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 14px;
  margin-bottom: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.02);
  color: #fff;
  outline: none;
  font-size: 0.95rem;
  ::placeholder { color: rgba(255,255,255,0.5); }
  &:focus { box-shadow: 0 6px 30px rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.08); }
`;

const Link = styled.a`
  color: rgba(255,255,255,0.6);
  text-decoration: underline;
  font-size: 0.9rem;
`;

const Submit = styled.button`
  width: 100%;
  height: 48px;
  margin-top: 8px;
  background: #fff;
  color: #07122bff;
  border-radius: 10px;
  font-weight: 700;
  border: none;
  cursor: pointer;
`;

const FooterNote = styled.div`
  margin-top: 12px;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.6);
`;

const RightTitle = styled.div`
  font-size: 130px;
  font-weight: 500;
  font-family: 'Inter', 'Arial', sans-serif;
  color: transparent;
  letter-spacing: 15px;
  user-select: none;
  text-align: center;
  position: relative;
  z-index: 1;
  -webkit-text-stroke: 1px #fff;
  text-stroke: 1px #fff;
  filter: drop-shadow(0 0 15px rgba(0, 132, 255, 0.8));

  &::before {
    content: 'NJBOT';
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    color: transparent;
    -webkit-text-stroke: 4px #0084ff;
    text-stroke: 4px #0084ff;
    z-index: -1;
  }
  
  @media (max-width: 1100px) { 
    font-size: 100px;
  }
  @media (max-width: 700px) { display: none; }
`;

const ErrorMessage = styled.p`
  color: #d12121;
  margin-top: 8px;
`;

export default function LoginFixed() {
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
          <SmallTitle>NJBOT</SmallTitle>
          <Heading>Faça seu login.</Heading>
          <Hint>Acesse o painel de controle do NJBot</Hint>

          <Field placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <Field placeholder="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} />

          <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            <Link href="#">Esqueci minha senha</Link>
          </div>

          <Submit onClick={handleLogin}>Entrar</Submit>

          {erro && <ErrorMessage>{erro}</ErrorMessage>}

          <FooterNote>
            <a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Ainda não tenho uma conta</a>
          </FooterNote>
        </Left>

        <Right>
          <RightTitle>NJBOT</RightTitle>
        </Right>
      </Card>
    </Container>
  );
}
