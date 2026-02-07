import BracketViewer from './components/BracketViewer';
import { useBigCommerce } from './hooks/useBigCommerce';

function App() {
  const { sku, options } = useBigCommerce();

  // If no SKU is provided yet, we can show a default or a message
  if (!sku) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#eee', fontStyle: 'italic', color: '#666' }}>
        Waiting for product data (SKU)...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <BracketViewer sku={sku} options={options} />
    </div>
  );
}

export default App;
