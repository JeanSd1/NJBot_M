import styled, { keyframes } from "styled-components"

const Header = styled.header`
  width: 90%;
  background-color: #14213d49;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  margin-top: -10px;
  border-radius: 10px;

  p{
    margin-left: 20px;
    font-size: 0.8rem;
  }
`

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const colorShift = keyframes`
  0% { color: #4994e4; }
  50% { color: #c74034; }
  100% { color: #10405a; }
`

const NJBot = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  display: flex;
  gap: 0;
`

const Letter = styled.span`
  color: ${props => props.color};
  animation: ${props => props.animate ? colorShift : 'none'} 7s infinite ease-in-out;
  font-family: 'Montserrat', sans-serif;
`


export default function DashboardHeader() {
  return (
    <Header>
      <LogoSection>
        <NJBot>
          <Letter color="#1754ec">N</Letter>
          <Letter color="#3163e4ff">J</Letter>
          <Letter color="#C3263B">B</Letter>
          <Letter color="#C3263B">ot</Letter>
        </NJBot>
      </LogoSection>
    </Header>
  )
}
