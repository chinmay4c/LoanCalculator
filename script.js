document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loan-form');
    const resultsSection = document.getElementById('results');
    const chartsSection = document.getElementById('charts');
    const amortizationSection = document.getElementById('amortization-schedule');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateLoan();
    });

    // Set default date to today
    document.getElementById('start-date').valueAsDate = new Date();
});

function calculateLoan() {
    const amount = parseFloat(document.getElementById('amount').value);
    const annualInterestRate = parseFloat(document.getElementById('interest').value);
    const years = parseInt(document.getElementById('years').value);
    const extraPayment = parseFloat(document.getElementById('extra-payment').value) || 0;
    const startDate = new Date(document.getElementById('start-date').value);
    const paymentFrequency = parseInt(document.getElementById('payment-frequency').value);

    const periodicInterestRate = (annualInterestRate / 100) / paymentFrequency;
    const totalPayments = years * paymentFrequency;

    if (amount > 0 && annualInterestRate > 0 && years > 0) {
        const periodicPayment = calculatePeriodicPayment(amount, periodicInterestRate, totalPayments);
        const schedule = generateAmortizationSchedule(amount, periodicInterestRate, totalPayments, periodicPayment, extraPayment, startDate, paymentFrequency);
        
        displayResults(schedule, periodicPayment, paymentFrequency);
        createCharts(schedule);
        displayAmortizationSchedule(schedule);
    } else {
        alert('Please enter valid values.');
    }
}

function calculatePeriodicPayment(principal, interestRate, payments) {
    return (principal * interestRate * Math.pow(1 + interestRate, payments)) / (Math.pow(1 + interestRate, payments) - 1);
}

function generateAmortizationSchedule(principal, interestRate, totalPayments, payment, extraPayment, startDate, paymentFrequency) {
    let balance = principal;
    let totalInterest = 0;
    const schedule = [];
    let paymentDate = new Date(startDate);

    for (let i = 1; i <= totalPayments && balance > 0; i++) {
        const interestPayment = balance * interestRate;
        let principalPayment = payment - interestPayment;
        const totalPayment = payment + extraPayment;

        if (principalPayment + extraPayment > balance) {
            principalPayment = balance;
            extraPayment = 0;
        }

        balance -= (principalPayment + extraPayment);
        totalInterest += interestPayment;

        schedule.push({
            paymentNumber: i,
            date: new Date(paymentDate),
            payment: totalPayment,
            principal: principalPayment,
            interest: interestPayment,
            extraPayment: extraPayment,
            balance: balance
        });

        // Update payment date based on frequency
        switch(paymentFrequency) {
            case 26: // Bi-weekly
                paymentDate.setDate(paymentDate.getDate() + 14);
                break;
            case 52: // Weekly
                paymentDate.setDate(paymentDate.getDate() + 7);
                break;
            default: // Monthly
                paymentDate.setMonth(paymentDate.getMonth() + 1);
        }

        if (balance <= 0) break;
    }

    return schedule;
}

function displayResults(schedule, periodicPayment, paymentFrequency) {
    const resultsSection = document.getElementById('results');
    resultsSection.classList.remove('hidden');

    const lastPayment = schedule[schedule.length - 1];
    const totalPaid = schedule.reduce((sum, payment) => sum + payment.payment, 0);
    const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);

    document.getElementById('periodic-payment').textContent = formatCurrency(periodicPayment);
    document.getElementById('total-payment').textContent = formatCurrency(totalPaid);
    document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
    document.getElementById('payoff-date').textContent = formatDate(lastPayment.date);

    // Calculate and display savings
    const originalPayments = parseInt(document.getElementById('years').value) * paymentFrequency;
    const paymentsSaved = originalPayments - schedule.length;
    const timeSaved = calculateTimeSaved(paymentsSaved, paymentFrequency);
    const interestSaved = (periodicPayment * originalPayments) - totalPaid;

    const savingsHTML = `
        <h3>Potential Savings</h3>
        <p>Time saved: ${timeSaved}</p>
        <p>Interest saved: ${formatCurrency(interestSaved)}</p>
    `;

    document.getElementById('savings').innerHTML = savingsHTML;
}

function calculateTimeSaved(paymentsSaved, paymentFrequency) {
    const yearsSaved = Math.floor(paymentsSaved / paymentFrequency);
    const monthsSaved = Math.round((paymentsSaved % paymentFrequency) * (12 / paymentFrequency));
    
    let timeSaved = '';
    if (yearsSaved > 0) {
        timeSaved += `${yearsSaved} year${yearsSaved > 1 ? 's' : ''}`;
    }
    if (monthsSaved > 0) {
        timeSaved += `${timeSaved ? ' and ' : ''}${monthsSaved} month${monthsSaved > 1 ? 's' : ''}`;
    }
    return timeSaved || 'No time saved';
}

function createCharts(schedule) {
    const chartsSection = document.getElementById('charts');
    chartsSection.classList.remove('hidden');

    createPaymentBreakdownChart(schedule);
    createBalanceOverTimeChart(schedule);
}

function createPaymentBreakdownChart(schedule) {
    const ctx = document.getElementById('payment-breakdown-chart').getContext('2d');
    
    const totalPrincipal = schedule.reduce((sum, payment) => sum + payment.principal, 0);
    const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
    const totalExtraPayments = schedule.reduce((sum, payment) => sum + payment.extraPayment, 0);

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Principal', 'Interest', 'Extra Payments'],
            datasets: [{
                data: [totalPrincipal, totalInterest, totalExtraPayments],
                backgroundColor: ['#2ecc71', '#e74c3c', '#3498db']
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Payment Breakdown'
            }
        }
    });
}

function createBalanceOverTimeChart(schedule) {
    const ctx = document.getElementById('balance-over-time-chart').getContext('2d');
    
    const labels = schedule.map(payment => formatDate(payment.date));
    const balances = schedule.map(payment => payment.balance);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Loan Balance',
                data: balances,
                borderColor: '#2980b9',
                fill: false
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Loan Balance Over Time'
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Balance'
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function displayAmortizationSchedule(schedule) {
    const amortizationSection = document.getElementById('amortization-schedule');
    amortizationSection.classList.remove('hidden');

    const tableBody = document.querySelector('#schedule-table tbody');
    tableBody.innerHTML = '';

    schedule.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.paymentNumber}</td>
            <td>${formatDate(payment.date)}</td>
            <td>${formatCurrency(payment.payment)}</td>
            <td>${formatCurrency(payment.principal)}</td>
            <td>${formatCurrency(payment.interest)}</td>
            <td>${formatCurrency(payment.extraPayment)}</td>
            <td>${formatCurrency(payment.balance)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}