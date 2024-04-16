import StreamedContentComponent  from './components/streamedcontent'

import './App.css'

function App() {

  const onPcTypeRecommended=(pc:string)=>{
    console.log("filtering...",pc);
    //Filter logic here
  }

  return (
    <>
    <h3>LLAMA.cpp Selfhosting Demo</h3>
        <StreamedContentComponent onPcTypeRecommended={onPcTypeRecommended}></StreamedContentComponent>

    </>
  )
}

export default App
