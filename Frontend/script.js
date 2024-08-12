document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('user-credentials');
    form.onsubmit = async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const time_left = await sendDataToServer(username, password);

            if (time_left) {
                hideLoginStage();
                displayTime(username, password, parseInt(time_left, 10)); // Ensure time_left is a number
            } else {
                console.error('Failed to get time left');
            }
        } catch (error) {
            console.error('Error handling response:', error);
        }
    };
});



// Function to send data to the server
async function sendDataToServer(username, password) {
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.text();
    } catch (error) {
        console.error('Error sending data to server:', error);
        return null;
    }
}

// Function to hide the login stage
function hideLoginStage() {
    document.getElementById('login_stage').style.display = 'none';
}

// Function to display the remaining time
function displayTime(username, password, time_left) {
    const displayTimeDiv = document.getElementById('Display_time_stage');

    // Function to update the display
    function updateDisplay() 
    {
        const message = time_left > 0
                ? `<h1>Hello, ${username}!</h1><h2><br><br>Your remaining time is: ${time_left} seconds</h2>`
                : `<h1>Hello, ${username}!</h1><h2><br><br>Your time is up!<br><br>You are locked out :(</h2>`;

        displayTimeDiv.innerHTML = message;
    }

    // Update the display initially
    updateDisplay();

    // Decrease time_left every second
    const intervalId = setInterval(async () => {
        time_left--;

        // Update the display with the new time
        if (time_left >= 0) {
            updateDisplay();
        }

        // Send the updated time to the server
        await updateTimeOnServer(username, password, time_left);

        // Clear the interval when time_left reaches 0
        if (time_left <= 0) {
            clearInterval(intervalId);
        }
    }, 1000);
}

// Function to update time on the server
async function updateTimeOnServer(username, password, time_left) {
    try {
        const response = await fetch('http://localhost:3000/update_time', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, time_left }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.text();
    } catch (error) {
        console.error('Error updating time on server:', error);
    }
}
