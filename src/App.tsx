import StreamedContentComponent  from './components/streamedcontent'

import './App.css'

function App() {

  const onPcTypeRecommended=(pc:string)=>{
    console.log("filtering...",pc);
    //Filter logic here
  }

  return (
<div className="min-h-screen bg-gray-100">
    <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
                <div className="flex">
                    <div className="flex-shrink-0 flex items-center">
                    LLAMA.cpp Selfhosting Demo

                    </div>
                </div>
                <div className="hidden sm:flex sm:items-center sm:ml-6">
                    <a href="#" className="text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium">Home</a>
                    <a href="#" className="text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                    <a href="#" className="text-gray-800 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium">About</a>
                </div>
            </div>
        </div>
    </nav>
    <main className="py-10">
        <div className="w-96 mx-auto"> 
            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div className="p-6 bg-white border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Get AI recommendation</h3>
                    <div className="p-4 border rounded-lg shadow-lg bg-white">
                        <StreamedContentComponent onPcTypeRecommended={onPcTypeRecommended}></StreamedContentComponent>
                    </div>
                </div>
            </div>
        </div>
    </main>
</div>



  )
}

export default App
