document.addEventListener('DOMContentLoaded', async () => {
    const accountDetailsDiv = document.getElementById('accountDetails');
    const connectWalletButton = document.getElementById('connectWallet');
    const disconnectWalletButton = document.getElementById('disconnectWallet');
    const accountAddressInput = document.getElementById('accountAddress');
    const addAccountButton = document.getElementById('addAccount');
    const portfolioListDiv = document.getElementById('portfolioList');

    let web3 = null;
    const accounts = [];

    connectWalletButton.addEventListener('click', async () => {
        try {
            if (!web3) {
                // Request permission to access the user's Ethereum accounts
                await window.ethereum.request({ method: 'eth_requestAccounts' });

                // Initialize Web3.js
                web3 = new Web3(window.ethereum);

                // Get the current Ethereum account
                const web3Accounts = await web3.eth.getAccounts();
                const currentAccount = web3Accounts[0];

                // Get the ETH balance of the current account
                const balance = await web3.eth.getBalance(currentAccount);
                const etherBalance = web3.utils.fromWei(balance, 'ether');

                // Display the account and balance details
                const accountInfo = `<p>Connected Account: ${currentAccount}</p><p>Balance: ${etherBalance} ETH</p>`;
                accountDetailsDiv.innerHTML = accountInfo;

                // Show the "Disconnect Wallet" button
                connectWalletButton.style.display = 'none';
                disconnectWalletButton.style.display = 'inline-block';
            }
        } catch (error) {
            console.error(error);
        }
    });

    disconnectWalletButton.addEventListener('click', () => {
        // Disconnect the wallet by resetting the web3 instance
        web3 = null;

        // Clear the displayed details
        accountDetailsDiv.innerHTML = '';

        // Show the "Connect Wallet" button and hide the "Disconnect Wallet" button
        connectWalletButton.style.display = 'inline-block';
        disconnectWalletButton.style.display = 'none';
    });

    addAccountButton.addEventListener('click', async () => {
        const address = accountAddressInput.value;
        if (address && web3) {
            accounts.push(address);

            // Clear the input field
            accountAddressInput.value = '';

            // Update the portfolio list
            await updatePortfolioList();
        }
    });

    async function updatePortfolioList() {
        let portfolioHTML = '<ul>';
        const balances = await Promise.all(accounts.map(async (account) => {
            const balance = await web3.eth.getBalance(account);
            const etherBalance = web3.utils.fromWei(balance, 'ether');
            portfolioHTML += `<li>${account}: ${etherBalance} ETH</li>`;
            return `${account}: ${etherBalance} ETH`;
        }));
        portfolioHTML += '</ul>';
        portfolioListDiv.innerHTML = portfolioHTML;
    }

    // Add the following code to your app.js
    const alphaVantageApiKey = 'WQUPLGX6W6VDIKZZ'; // Replace with your API key
    const alphaVantageEndpoint = 'https://www.alphavantage.co/query';

    // Function to fetch ETH to USD exchange rate
    async function fetchEthToUsdExchangeRate() {
        try {
            const response = await fetch(`${alphaVantageEndpoint}?function=CURRENCY_EXCHANGE_RATE&from_currency=ETH&to_currency=USD&apikey=${alphaVantageApiKey}`);
            const data = await response.json();
            return parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // Function to update the ETH chart
    async function updateEthChart() {
        const netEthOwned = accounts.length; // Assuming 1 ETH per account for simplicity
        const ethToUsdExchangeRate = await fetchEthToUsdExchangeRate();

        if (ethToUsdExchangeRate !== null) {
            const usdEquivalent = netEthOwned * ethToUsdExchangeRate;

            // Display the USD equivalent on the page
            const usdEquivalentElement = document.getElementById('usdEquivalent');
            usdEquivalentElement.textContent = `USD Equivalent: $${usdEquivalent.toFixed(2)}`;

            // Create a Chart.js chart
            const ctx = document.getElementById('ethChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Net ETH Owned'],
                    datasets: [
                        {
                            label: 'ETH',
                            data: [netEthOwned],
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                },
            });
        }
    }

    // Call updateEthChart to initially render the chart and data
    updateEthChart();

    // Event listener for the "Send" button
    document.getElementById('sendButton').addEventListener('click', async () => {
        const recipientAddress = document.getElementById('recipientAddress').value;
        const crypto = document.getElementById('cryptoToSend').value;
        const amount = parseFloat(document.getElementById('sendAmount').value);
    
        if (!web3) {
            alert("Please connect your wallet (e.g., MetaMask) before sending.");
            return;
        }
    
        const userAddress = await web3.eth.getCoinbase(); // Get the user's MetaMask address
    
        // Check if the user's address is available
        if (!userAddress) {
            alert("User's address not available. Please make sure MetaMask is unlocked.");
            return;
        }
    
        // Transaction object to send Ether to the recipient address
        const transactionObject = {
            from: userAddress, // Specify the sender's address
            to: recipientAddress, // Specify the recipient's address
            value: web3.utils.toWei(amount.toString(), 'ether'), // Amount in Wei
        };
    
        try {
            // Send the transaction using MetaMask
            await web3.eth.sendTransaction(transactionObject);
    
            // Handle success or provide feedback to the user
            alert(`Successfully sent ${amount} ${crypto} to ${recipientAddress}`);
        } catch (error) {
            console.error(error);
            alert(`Transaction failed: ${error.message}`);
        }
    });      
});