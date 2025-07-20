'use client';

import { useState } from 'react';

export function Calculator(): JSX.Element {
  const [num1, setNum1] = useState<string>('0');
  const [num2, setNum2] = useState<string>('0');
  const [operation, setOperation] = useState<string>('add');
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  const calculate = (): void => {
    const a = parseFloat(num1);
    const b = parseFloat(num2);
    
    if (isNaN(a) || isNaN(b)) {
      setError('Please enter valid numbers');
      setResult(null);
      return;
    }

    setError('');
    
    switch (operation) {
      case 'add':
        setResult(a + b);
        break;
      case 'subtract':
        setResult(a - b);
        break;
      case 'multiply':
        setResult(a * b);
        break;
      case 'divide':
        if (b === 0) {
          setError('Cannot divide by zero');
          setResult(null);
        } else {
          setResult(a / b);
        }
        break;
      default:
        setError('Invalid operation');
        setResult(null);
    }
  };

  return (
    <div className="bg-gray-100 p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Calculator</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="num1" className="block text-sm font-medium mb-1">
            First Number
          </label>
          <input
            id="num1"
            type="number"
            value={num1}
            onChange={(e) => setNum1(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            aria-label="First number"
          />
        </div>
        
        <div>
          <label htmlFor="operation" className="block text-sm font-medium mb-1">
            Operation
          </label>
          <select
            id="operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            aria-label="Operation"
          >
            <option value="add">Add (+)</option>
            <option value="subtract">Subtract (-)</option>
            <option value="multiply">Multiply (×)</option>
            <option value="divide">Divide (÷)</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="num2" className="block text-sm font-medium mb-1">
            Second Number
          </label>
          <input
            id="num2"
            type="number"
            value={num2}
            onChange={(e) => setNum2(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            aria-label="Second number"
          />
        </div>
        
        <button
          onClick={calculate}
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
          aria-label="Calculate"
        >
          Calculate
        </button>
        
        {error && (
          <div className="text-red-500 text-sm" role="alert">
            {error}
          </div>
        )}
        
        {result !== null && !error && (
          <div className="text-green-600 text-xl font-bold" aria-live="polite">
            Result: {result}
          </div>
        )}
      </div>
    </div>
  );
}