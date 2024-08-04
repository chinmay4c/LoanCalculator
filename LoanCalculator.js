import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LoanCalculator = () => {
  const [loans, setLoans] = useState([
    { id: 1, amount: 200000, interestRate: 3.5, term: 30, extraPayment: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(25);
  const [inflationRate, setInflationRate] = useState(2);
  const [results, setResults] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);

  useEffect(() => {
    calculateLoans();
  }, [loans, taxRate, inflationRate]);

  const calculateLoans = () => {
    const newResults = loans.map(loan => calculateLoan(loan));
    setResults(newResults);
    setComparisonData(generateComparisonData(newResults));
  };

  const calculateLoan = (loan) => {
    const { amount, interestRate, term, extraPayment } = loan;
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = term * 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);

    let balance = amount;
    let totalInterest = 0;
    let totalPaid = 0;
    let months = 0;
    const schedule = [];

    while (balance > 0 && months < totalPayments) {
      const interestPayment = balance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment + extraPayment;
      
      if (principalPayment > balance) {
        principalPayment = balance;
      }
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      totalPaid += principalPayment + interestPayment;
      months++;

      schedule.push({
        month: months,
        balance,
        principalPayment,
        interestPayment,
        totalInterest,
        totalPaid
      });
    }

    const taxDeduction = totalInterest * (taxRate / 100);
    const effectiveInterestRate = (totalInterest - taxDeduction) / amount * 100;
    const realCostOfLoan = calculateRealCost(totalPaid, inflationRate, months);

    return {
      ...loan,
      monthlyPayment,
      totalInterest,
      totalPaid,
      months,
      taxDeduction,
      effectiveInterestRate,
      realCostOfLoan,
      schedule
    };
  };

  const calculateRealCost = (nominalCost, inflationRate, months) => {
    const annualInflationRate = inflationRate / 100;
    const monthlyInflationRate = Math.pow(1 + annualInflationRate, 1/12) - 1;
    let realCost = 0;
    for (let i = 0; i < months; i++) {
      realCost += nominalCost / months / Math.pow(1 + monthlyInflationRate, i);
    }
    return realCost;
  };

  const generateComparisonData = (results) => {
    const maxMonths = Math.max(...results.map(r => r.months));
    const comparisonData = [];

    for (let i = 0; i <= maxMonths; i++) {
      const dataPoint = { month: i };
      results.forEach((result, index) => {
        const scheduleItem = result.schedule[i];
        if (scheduleItem) {
          dataPoint[`loan${index + 1}Balance`] = scheduleItem.balance;
          dataPoint[`loan${index + 1}TotalPaid`] = scheduleItem.totalPaid;
        } else {
          dataPoint[`loan${index + 1}Balance`] = 0;
          dataPoint[`loan${index + 1}TotalPaid`] = result.totalPaid;
        }
      });
      comparisonData.push(dataPoint);
    }

    return comparisonData;
  };

  const addLoan = () => {
    const newLoan = {
      id: loans.length + 1,
      amount: 200000,
      interestRate: 3.5,
      term: 30,
      extraPayment: 0
    };
    setLoans([...loans, newLoan]);
  };

  const updateLoan = (id, field, value) => {
    const updatedLoans = loans.map(loan =>
      loan.id === id ? { ...loan, [field]: parseFloat(value) } : loan
    );
    setLoans(updatedLoans);
  };

  const removeLoan = (id) => {
    const updatedLoans = loans.filter(loan => loan.id !== id);
    setLoans(updatedLoans);
  };

  const renderLoanInputs = () => {
    return loans.map(loan => (
      <div key={loan.id} className="loan-inputs">
        <h3>Loan {loan.id}</h3>
        <input
          type="number"
          value={loan.amount}
          onChange={(e) => updateLoan(loan.id, 'amount', e.target.value)}
          placeholder="Loan Amount"
        />
        <input
          type="number"
          value={loan.interestRate}
          onChange={(e) => updateLoan(loan.id, 'interestRate', e.target.value)}
          placeholder="Interest Rate (%)"
          step="0.1"
        />
        <input
          type="number"
          value={loan.term}
          onChange={(e) => updateLoan(loan.id, 'term', e.target.value)}
          placeholder="Loan Term (years)"
        />
        <input
          type="number"
          value={loan.extraPayment}
          onChange={(e) => updateLoan(loan.id, 'extraPayment', e.target.value)}
          placeholder="Extra Monthly Payment"
        />
        <button onClick={() => removeLoan(loan.id)}>Remove Loan</button>
      </div>
    ));
  };

  const renderResults = () => {
    return results.map((result, index) => (
      <div key={index} className="loan-result">
        <h3>Loan {index + 1} Results</h3>
        <p>Monthly Payment: ${result.monthlyPayment.toFixed(2)}</p>
        <p>Total Interest: ${result.totalInterest.toFixed(2)}</p>
        <p>Total Paid: ${result.totalPaid.toFixed(2)}</p>
        <p>Loan Term: {result.months} months ({(result.months / 12).toFixed(2)} years)</p>
        <p>Tax Deduction: ${result.taxDeduction.toFixed(2)}</p>
        <p>Effective Interest Rate: {result.effectiveInterestRate.toFixed(2)}%</p>
        <p>Real Cost of Loan: ${result.realCostOfLoan.toFixed(2)}</p>
      </div>
    ));
  };



  return (
    <div className="loan-calculator">
      <h1>Advanced Loan Comparison Calculator</h1>
      <div className="inputs">
        {renderLoanInputs()}
        <button onClick={addLoan}>Add Another Loan</button>
        <div className="global-inputs">
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value))}
            placeholder="Tax Rate (%)"
          />
          <input
            type="number"
            value={inflationRate}
            onChange={(e) => setInflationRate(parseFloat(e.target.value))}
            placeholder="Inflation Rate (%)"
          />
        </div>
      </div>
      <div className="results">
        {renderResults()}
      </div>
      <div className="charts">
        <h2>Loan Balance Comparison</h2>
        {renderBalanceChart()}
        <h2>Total Paid Comparison</h2>
        {renderTotalPaidChart()}
        <h2>Interest vs Principal</h2>
        {renderInterestVsPrincipalChart()}
      </div>
    </div>
  );
};

export default LoanCalculator;