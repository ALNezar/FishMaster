import { useState } from 'react';
import './App.scss';
import Button from './components/common/button/button.jsx';
import Nav from './components/common/nav/NavBar.jsx';
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Nav/>
      
      <Button>Home</Button>
      <Button onClick={() => console.log("clicked")}>Get Started!</Button>
      <Button size="small">Small</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="small">gaming</Button>



      <Button onClick={() => setCount(count + 1)}>
        count is {count}
      </Button>
     
    </>
  );
}

export default App;
