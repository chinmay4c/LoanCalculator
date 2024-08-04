document.getElementById('loan-form').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateLoan();
});

function calculateLoan() {
    const amount = parseFloat(document.getElementById('amount').value);
    const interestRate = parseFloat(document.getElementById('interest').value) / 100 / 12;
    const years = parseInt(document.getElementById('years').value);
    const extraPayment = parseFloat(document.getElementById('extra-payment').value) || 0;
    const numberOfPayments = years * 12;

    if (amount > 0 && interestRate > 0 && years > 0) {
        const x = Math.pow(1 + interestRate, numberOfPayments);
        const monthlyPayment = (amount * x * interestRate) / (x - 1);
        const totalPayment = monthlyPayment * numberOfPayments;
        const totalInterest = totalPayment - amount;

        displayResults(monthlyPayment, totalPayment, totalInterest);
        calculateAmortizationSchedule(amount, interestRate, years, monthlyPayment, extraPayment);
    } else {
        alert('Please enter valid values.');
    }
}

function displayResults(monthlyPayment, totalPayment, totalInterest) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');

    document.getElementById('monthly-payment').innerHTML = `Monthly Payment: $${monthlyPayment.toFixed(2)}`;
    document.getElementById('total-payment').innerHTML = `Total Payment: $${totalPayment.toFixed(2)}`;
    document.getElementById('total-interest').innerHTML = `Total Interest: $${totalInterest.toFixed(2)}`;
}

function calculateAmortizationSchedule(principal, interestRate, years, monthlyPayment, extraPayment) {
    const schedule = [];
    let balance = principal;
    let totalInterest = 0;
    let month = 0;

    while (balance > 0) {
        month++;
        const interestPayment = balance * interestRate;
        let principalPayment = monthlyPayment - interestPayment + extraPayment;

        if (principalPayment > balance) {
            principalPayment = balance;
        }

        balance -= principalPayment;
        totalInterest += interestPayment;

        schedule.push({
            month,
            payment: principalPayment + interestPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance
        });

        if (month >= years * 12) break;
    }

    displayAmortizationSchedule(schedule);
    calculateSavings(month, totalInterest, principal + totalInterest);
}

function displayAmortizationSchedule(schedule) {
    const tableBody = document.querySelector('#schedule-table tbody');
    tableBody.innerHTML = '';

    schedule.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.month}</td>
            <td>$${row.payment.toFixed(2)}</td>
            <td>$${row.principal.toFixed(2)}</td>
            <td>$${row.interest.toFixed(2)}</td>
            <td>$${row.balance.toFixed(2)}</td>
        `;
        tableBody.appendChild(tr);
    });

    document.getElementById('amortization-schedule').classList.remove('hidden');
}

function calculateSavings(actualMonths, actualInterest, originalTotal) {
    const originalMonths = parseInt(document.getElementById('years').value) * 12;
    const monthsSaved = originalMonths - actualMonths;
    const interestSaved = originalTotal - (parseFloat(document.getElementById('amount').value) + actualInterest);

    const savingsHTML = `
        <p>Loan paid off ${monthsSaved} months early.</p>
        <p>Total interest saved: $${interestSaved.toFixed(2)}</p>
    `;

    document.getElementById('savings').innerHTML = savingsHTML;
    document.getElementById('payoff-date').innerHTML = `Payoff Date: ${getPayoffDate(actualMonths)}`;
}

function getPayoffDate(months) {
    const today = new Date();
    today.setMonth(today.getMonth() + months);
    return today.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}