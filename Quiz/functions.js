document.addEventListener('DOMContentLoaded', function () {
    const playButton = document.getElementById('play-button');
    const optionsContainer = document.getElementById('options-container');
    const quizContainer = document.getElementById('quiz-container');
    const startMenu = document.getElementById('start-menu');
    const highscoreButton = document.getElementById('highscore-button');
    const highscoreContainer = document.getElementById('highscore-container');
    const highscoreList = document.getElementById('highscore-list');
    const closeHighscoreButton = document.getElementById('close-highscore');
    const categoryNameElement = document.getElementById('category-name');
    const countdownElement = document.getElementById('countdown');
    let timerInterval;
    let score = 0;
    const highscores = [
        { name: "Aitzaz", score: 70 },
        { name: "Philip", score: 82 },
        { name: "Abdul", score: 95 }
    ];

    initDisplay();

    playButton.addEventListener('click', showOptions);
    highscoreButton.addEventListener('click', showHighscores);
    closeHighscoreButton.addEventListener('click', closeHighscores);
    document.getElementById('start-button').addEventListener('click', startQuizHandler);

    function initDisplay() {
        optionsContainer.style.display = 'none';
        quizContainer.style.display = 'none';
        startMenu.style.display = 'block';
    }

    function showOptions() {
        playButton.style.display = 'none';
        optionsContainer.style.display = 'block';
    }

    function showHighscores() {
        startMenu.style.display = 'none';
        highscoreContainer.style.display = 'block';
        updateHighscoreList();
    }

    function closeHighscores() {
        highscoreContainer.style.display = 'none';
        startMenu.style.display = 'block';
    }

    function startQuizHandler() {
        const category = document.getElementById('category-select').value;
        const difficulty = document.getElementById('difficulty-select').value;
        const selectedCategory = document.getElementById('category-select').selectedOptions[0].dataset.name;

        if (!category || !difficulty) {
            alert('Bitte wähle eine Kategorie und eine Schwierigkeit aus!');
            return;
        }

        categoryNameElement.textContent = selectedCategory;
        const apiUrl = `https://opentdb.com/api.php?amount=5&category=${category}&difficulty=${difficulty}&type=multiple`;
        optionsContainer.style.display = 'none';
        quizContainer.style.display = 'block';
        startMenu.style.display = 'none';
        startQuiz(apiUrl);
    }

    function startQuiz(apiUrl) {
        resetQuizDisplay();

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.results.length === 0) {
                    alert('Keine Fragen verfügbar. Bitte wähle eine andere Kategorie oder Schwierigkeit.');
                    return;
                }
                loadQuiz(data.results);
            })
            .catch(error => {
                console.error('Fehler beim Abrufen der Quizdaten:', error);
                alert('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
            });
    }

    function resetQuizDisplay() {
        document.getElementById('question').innerHTML = 'Question is loading...';
        document.getElementById('answers').innerHTML = '';
        score = 0;
        updateScoreDisplay();
        document.querySelectorAll('.indicator').forEach(indicator => {
            indicator.className = 'indicator w-12 h-6 bg-gray-300 rounded-full';
        });
        clearInterval(timerInterval);
        countdownElement.textContent = '10.0';
    }

    function loadQuiz(questions) {
        displayQuestion(questions, 0);
        updateScoreDisplay();
    }

    function displayQuestion(questions, index) {
        clearInterval(timerInterval);

        if (index >= questions.length) {
            endQuiz();
            return;
        }

        const question = questions[index];
        console.log("Aktuelle Frage:", question);
        console.log("Richtige Antwort:", question.correct_answer);
        console.log("Falsche Antworten:", question.incorrect_answers);

        if (!question.correct_answer || !question.incorrect_answers) {
            alert('Daten fehlen! Überprüfe die API-Daten.');
            return;
        }

        document.getElementById('question').innerHTML = decodeHTML(question.question);

        const answersContainer = document.getElementById('answers');
        answersContainer.innerHTML = '';

        const allAnswers = [...question.incorrect_answers, question.correct_answer].sort(() => Math.random() - 0.5);
        allAnswers.forEach(answer => {
            const button = document.createElement('button');
            button.innerHTML = decodeHTML(answer);
            button.className = 'answer-button';
            button.onclick = () => checkAnswer(button, answer, question.correct_answer, questions, index);
            answersContainer.appendChild(button);
        });

        startTimer(() => checkAnswer(null, null, question.correct_answer, questions, index));
    }


    function checkAnswer(button, selectedAnswer, correctAnswer, questions, index) {
        // Stoppt den Timer
        clearInterval(timerInterval);

        document.querySelectorAll('.answer-button').forEach(btn => {
            btn.disabled = true;

            const decodedBtnText = decodeHTML(btn.textContent).trim().toLowerCase();
            const decodedCorrectAnswer = decodeHTML(correctAnswer).trim().toLowerCase();

            if (decodedBtnText === decodedCorrectAnswer) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('incorrect');
            }
        });

        let isCorrect = false;
        if (button && decodeHTML(selectedAnswer).trim().toLowerCase() === decodeHTML(correctAnswer).trim().toLowerCase()) {
            isCorrect = true;
            button.classList.add('correct');
            calculatePoints(index);
        } else if (button) {
            button.classList.add('incorrect');
        }

        updateScoreIndicators(isCorrect);

        setTimeout(() => displayQuestion(questions, index + 1), 2000);
    }


    function getBasePoints(difficulty) {
        let basePoints;
        switch (difficulty) {
            case 'easy':
                basePoints = 10;
                break;
            case 'medium':
                basePoints = 15;
                break;
            case 'hard':
                basePoints = 25;
                break;
            default:
                basePoints = 10;
        }
        return basePoints;
    }


    function calculatePoints() {
        const difficulty = document.getElementById('difficulty-select').value;
        const basePoints = getBasePoints(difficulty);
        const timeBonus = Math.ceil(parseFloat(countdownElement.textContent));
        score += basePoints + timeBonus;
        updateScoreDisplay();
    }


    function updateScoreDisplay() {
        const pointsDisplay = document.getElementById('points-display');
        if (pointsDisplay) {
            pointsDisplay.textContent = `Score: ${score}`;
        }
    }

    function updateScoreIndicators(isCorrect) {
        const currentIndicator = Array.from(document.querySelectorAll('.indicator'))
            .find(indicator => !indicator.classList.contains('bg-green-500') && !indicator.classList.contains('bg-red-500'));

        if (currentIndicator) {
            currentIndicator.classList.remove('bg-gray-300');
            currentIndicator.classList.add(isCorrect ? 'bg-green-500' : 'bg-red-500');
        }
    }

    function endQuiz() {
        quizContainer.style.display = 'none';
        const nameInputContainer = document.createElement('div');
        nameInputContainer.id = 'name-input-container';
        nameInputContainer.className = 'flex flex-col items-center p-6 bg-gradient-to-br from-pink-400 via-yellow-300 to-blue-300 rounded-lg shadow-xl';

        const inputLabel = document.createElement('label');
        inputLabel.textContent = 'Enter your name:';
        inputLabel.className = 'text-xl font-semibold text-white mb-4';
        nameInputContainer.appendChild(inputLabel);

        const nameInput = document.createElement('input');
        nameInput.id = 'name-input';
        nameInput.type = 'text';
        nameInput.className = 'w-80 p-3 mb-4 text-center text-gray-800 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-blue-400';
        nameInputContainer.appendChild(nameInput);

        const saveButton = document.createElement('button');
        saveButton.id = 'save-button';
        saveButton.textContent = 'Save';
        saveButton.className = 'bg-gradient-to-r from-green-400 to-green-500 text-white py-3 px-10 rounded-full shadow-lg text-lg hover:scale-105 transition-transform mb-2';
        saveButton.onclick = () => saveHighScore(nameInput.value);
        nameInputContainer.appendChild(saveButton);

        const skipButton = document.createElement('button');
        skipButton.id = 'skip-button';
        skipButton.textContent = 'Skip';
        skipButton.className = 'bg-gradient-to-r from-red-400 to-red-500 text-white py-2 px-8 rounded-lg shadow-md text-md hover:scale-105 transition-transform';
        skipButton.addEventListener('click', returnToMenu);
        nameInputContainer.appendChild(skipButton);

        document.body.appendChild(nameInputContainer);
    }

    function saveHighScore(name) {
        if (!name) {
            alert('Please enter a name!');
            return;
        }

        highscores.push({ name: name, score: score });
        highscores.sort((a, b) => b.score - a.score);
        updateHighscoreList();
        returnToMenu();
    }

    function updateHighscoreList() {
        highscoreList.innerHTML = '';

        highscores.sort((a, b) => b.score - a.score);
        highscores.forEach((highscore, index) => {
            const li = document.createElement('li');
            li.className = 'highscore-entry';
            li.innerHTML = `<span>${index + 1}.</span><span>${highscore.name}</span><span>${highscore.score} Points</span>`;
            highscoreList.appendChild(li);
        });

        const entries = document.querySelectorAll('.highscore-entry');
        document.querySelector('.highscore-list-container').style.overflowY = entries.length > 3 ? 'auto' : 'hidden';
    }

    function returnToMenu() {
        const nameInputContainer = document.getElementById('name-input-container');
        if (nameInputContainer) {
            nameInputContainer.remove();
        }

        startMenu.style.display = 'block';
        optionsContainer.style.display = 'block';
        quizContainer.style.display = 'none';
    }

    function decodeHTML(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    function startTimer(timeUpCallback) {
        let timeLeft = 10.0;
        countdownElement.textContent = timeLeft.toFixed(1);
        countdownElement.style.color = 'orange';

        const sandglassImage = document.querySelector('.sandglass img');
        sandglassImage.src = 'sanduhr.gif';

        timerInterval = setInterval(() => {
            timeLeft -= 0.1;
            countdownElement.textContent = timeLeft.toFixed(1);

            if (timeLeft <= 3) {
                countdownElement.style.color = 'red';
            }

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                countdownElement.textContent = '0.0';
                timeUpCallback();
            }
        }, 100);
    }

});
