document.addEventListener('DOMContentLoaded', function() {
    const loansContainer = document.getElementById('loans-container');
    const addLoanButton = document.getElementById('add-loan');
    const resultsSection = document.getElementById('results');
    const resultsContainer = document.getElementById('results-container');
    const chartsSection = document.getElementById('charts');
    const amortizationSection = document.getElementById('amortization');
    const amortizationContainer = document.getElementById('amortization-container');

    let loans = [];
    let loanId = 0;

    addLoanButton.addEventListener('click', addLoan);

    function addLoan() {
        loanId++;
        const loan = {
            id: loanId,
            amount: 200000,
            interestRate: 3.5,
            term: 30,
            extraPayment: 0
        };
        loans.push(loan);
        renderLoanInputs(loan);
        calculateAndRender();
    }

    function renderLoanInputs(loan) {
        const loanCard = document.createElement('div');
        loanCard.className = 'loan-card';
        loanCard.innerHTML = `
            <h3>Loan ${loan.id}</h3>
            <div class="input-group">
                <label for="amount-${loan.id}">Loan Amount ($)</label>
                <input type="number" id="amount-${loan.id}" value="${loan.amount}" min="1000" step="1000">
            </div>
            <div class="input-group">
                <label for="interest-${loan.id}">Interest Rate (%)</label>
                <input type="number" id="interest-${loan.id}" value="${loan.interestRate}" min="0" max="30" step="0.1">
            </div>
            <div class="input-group">
                <label for="term-${loan.id}">Loan Term (years)</label>
                <input type="number" id="term-${loan.id}" value="${loan.term}" min="1" max="50">
            </div>
            <div class="input-group">
                <label for="extra-${loan.id}">Extra Monthly Payment ($)</label>
                <input type="number" id="extra-${loan.id}" value="${loan.extraPayment}" min="0" step="100">
            </div>
            <button class="btn remove-loan" data-id="${loan.id}">Remove Loan</button>
        `;
        loansContainer.appendChild(loanCard);

        loanCard.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => updateLoan(loan.id));
        });

        loanCard.querySelector('.remove-loan').addEventListener('click', () => removeLoan(loan.id));

        anime({
            targets: loanCard,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutQuad'
        });
    }

    function updateLoan(id) {
        const loan = loans.find(l => l.id === id);
        loan.amount = parseFloat(document.getElementById(`amount-${id}`).value);
        loan.interestRate = parseFloat(document.getElementById(`interest-${id}`).value);
        loan.term = parseFloat(document.getElementById(`term-${id}`).value);
        loan.extraPayment = parseFloat(document.getElementById(`extra-${id}`).value);
        calculateAndRender();
    }

    function removeLoan(id) {
        loans = loans.filter(l => l.id !== id);
        const loanCard = document.querySelector(`.loan-card:has(#amount-${id})`);
        anime({
            targets: loanCard,
            opacity: 0,
            translateY: 20,
            duration: 500,
            easing: 'easeOutQuad',
            complete: function() {
                loanCard.remove();
                calculateAndRender();
            }
        });
    }

    function calculateAndRender() {
        const taxRate = parseFloat(document.getElementById('tax-rate').value) / 100;
        const inflationRate = parseFloat(document.getElementById('inflation-rate').value) / 100;

        const results = loans.map(loan => calculateLoan(loan, taxRate, inflationRate));
        renderResults(results);
        renderCharts(results);
        renderAmortizationSchedules(results);

        resultsSection.classList.remove('hidden');
        chartsSection.classList.remove('hidden');
        amortizationSection.classList.remove('hidden');
    }

    function calculateLoan(loan, taxRate, inflationRate) {
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
                payment: principalPayment + interestPayment,
                principal: principalPayment,
                interest: interestPayment,
                balance: balance,
                totalInterest: totalInterest,
                totalPaid: totalPaid
            });
        }

        const taxDeduction = totalInterest * taxRate;
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
    }

    function calculateRealCost(nominalCost, inflationRate, months) {
        const monthlyInflationRate = Math.pow(1 + inflationRate, 1/12) - 1;
        let realCost = 0;
        for (let i = 0; i < months; i++) {
            realCost += nominalCost / months / Math.pow(1 + monthlyInflationRate, i);
        }
        return realCost;
    }

    function renderResults(results) {
        resultsContainer.innerHTML = '';
        results.forEach((result, index) => {
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.innerHTML = `
                <h3>Loan ${index + 1} Results</h3>
                <p>Monthly Payment: $${result.monthlyPayment.toFixed(2)}</p>
                <p>Total Interest: $${result.totalInterest.toFixed(2)}</p>
                <p>Total Paid: $${result.totalPaid.toFixed(2)}</p>
                <p>Loan Term: ${result.months} months (${(result.months / 12).toFixed(1)} years)</p>
                <p>Tax Deduction: $${result.taxDeduction.toFixed(2)}</p>
                <p>Effective Interest Rate: ${result.effectiveInterestRate.toFixed(2)}%</p>
                <p>Real Cost of Loan: $${result.realCostOfLoan.toFixed(2)}</p>
            `;
            resultsContainer.appendChild(resultCard);
        });
    }

    function renderCharts(results) {
        renderBalanceChart(results);
        renderPaymentChart(results);
        renderInterestPrincipalChart(results);
    }

    function renderBalanceChart(results) {
        const ctx = document.getElementById('balance-chart').getContext('2d');
        const datasets = results.map((result, index) => ({
            label: `Loan ${index + 1}`,
            data: result.schedule.map(entry => entry.balance),
            borderColor: getColor(index),
            fill: false
        }));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: results[0].schedule.map(entry => entry.month),
                datasets: datasets
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Loan Balance Over Time'
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Balance ($)'
                        }
                    }
                }
            }
        });
    }

    function renderPaymentChart(results) {
        const ctx = document.getElementById('payment-chart').getContext('2d');
        const datasets = results.map((result, index) => ({
            label: `Loan ${index + 1}`,
            data: result.schedule.map(entry => entry.payment),
            borderColor: getColor(index),
            fill: false
        }));

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: results[0].schedule.map(entry => entry.month),
                datasets: datasets
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Monthly Payments Over Time'
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Payment ($)'
                        }
                    }
                }
            }
        });
    }

    // Initialize with one loan
    addLoan();
});