import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calculator } from './Calculator';

describe('Calculator Component', () => {
  it('renders calculator with all elements', () => {
    render(<Calculator />);
    
    expect(screen.getByLabelText('First number')).toBeInTheDocument();
    expect(screen.getByLabelText('Second number')).toBeInTheDocument();
    expect(screen.getByLabelText('Operation')).toBeInTheDocument();
    expect(screen.getByLabelText('Calculate')).toBeInTheDocument();
  });

  it('performs addition correctly', async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    
    const num1Input = screen.getByLabelText('First number');
    const num2Input = screen.getByLabelText('Second number');
    const calculateButton = screen.getByLabelText('Calculate');
    
    await user.clear(num1Input);
    await user.type(num1Input, '10');
    await user.clear(num2Input);
    await user.type(num2Input, '5');
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result: 15')).toBeInTheDocument();
    });
  });

  it('performs subtraction correctly', async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    
    const num1Input = screen.getByLabelText('First number');
    const num2Input = screen.getByLabelText('Second number');
    const operationSelect = screen.getByLabelText('Operation');
    const calculateButton = screen.getByLabelText('Calculate');
    
    await user.clear(num1Input);
    await user.type(num1Input, '10');
    await user.clear(num2Input);
    await user.type(num2Input, '3');
    await user.selectOptions(operationSelect, 'subtract');
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result: 7')).toBeInTheDocument();
    });
  });

  it('performs multiplication correctly', async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    
    const num1Input = screen.getByLabelText('First number');
    const num2Input = screen.getByLabelText('Second number');
    const operationSelect = screen.getByLabelText('Operation');
    const calculateButton = screen.getByLabelText('Calculate');
    
    await user.clear(num1Input);
    await user.type(num1Input, '4');
    await user.clear(num2Input);
    await user.type(num2Input, '5');
    await user.selectOptions(operationSelect, 'multiply');
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result: 20')).toBeInTheDocument();
    });
  });

  it('performs division correctly', async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    
    const num1Input = screen.getByLabelText('First number');
    const num2Input = screen.getByLabelText('Second number');
    const operationSelect = screen.getByLabelText('Operation');
    const calculateButton = screen.getByLabelText('Calculate');
    
    await user.clear(num1Input);
    await user.type(num1Input, '20');
    await user.clear(num2Input);
    await user.type(num2Input, '4');
    await user.selectOptions(operationSelect, 'divide');
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Result: 5')).toBeInTheDocument();
    });
  });

  it('shows error for division by zero', async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    
    const num1Input = screen.getByLabelText('First number');
    const num2Input = screen.getByLabelText('Second number');
    const operationSelect = screen.getByLabelText('Operation');
    const calculateButton = screen.getByLabelText('Calculate');
    
    await user.clear(num1Input);
    await user.type(num1Input, '10');
    await user.clear(num2Input);
    await user.type(num2Input, '0');
    await user.selectOptions(operationSelect, 'divide');
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Cannot divide by zero')).toBeInTheDocument();
    });
  });

  it('shows error for invalid input', async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    
    const num1Input = screen.getByLabelText('First number');
    const calculateButton = screen.getByLabelText('Calculate');
    
    await user.clear(num1Input);
    await user.type(num1Input, 'abc');
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter valid numbers')).toBeInTheDocument();
    });
  });

  it('clears error when valid calculation is performed', async () => {
    const user = userEvent.setup();
    render(<Calculator />);
    
    const num1Input = screen.getByLabelText('First number');
    const num2Input = screen.getByLabelText('Second number');
    const operationSelect = screen.getByLabelText('Operation');
    const calculateButton = screen.getByLabelText('Calculate');
    
    // First cause an error
    await user.clear(num2Input);
    await user.type(num2Input, '0');
    await user.selectOptions(operationSelect, 'divide');
    await user.click(calculateButton);
    
    expect(screen.getByText('Cannot divide by zero')).toBeInTheDocument();
    
    // Then perform valid calculation
    await user.clear(num2Input);
    await user.type(num2Input, '2');
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Cannot divide by zero')).not.toBeInTheDocument();
      expect(screen.getByText(/Result:/)).toBeInTheDocument();
    });
  });
});