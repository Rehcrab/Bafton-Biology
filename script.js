let currentIdx = 0;
let hasKey = false;
let solvedIndices = new Set(); // Tracks completed puzzles
let hintCharges = 0;
let currentHintIdx = 0;
let bioWingSelection = null; // Tracks 'tech' or 'containment'
let lockedPath = null;
let visitedIndices = new Set(); // Tracks rooms that already gave rewards
let lockoutEndTime = 0; // Stores the timestamp when the lock should end
let activeLockoutInterval = null;
const content = [
    {
        type: "mode-select",
        text: "SELECT SYSTEM CLEARANCE LEVEL:",
        choices: [
            { label: "EASY (2 HINTS / 30 MIN)", charges: 2, time: 30, mode: "EASY" },
            { label: "MEDIUM (1 HINTS / 20 MIN)", charges: 1, time: 20, mode: "MEDIUM" },
            { label: "HARD (0 HINTS / 15 MIN)", charges: 0, time: 15, mode: "HARD" }
        ]
    },
    {
        type: "lore",
        text: "YEAR: 2167. MONTH: MAYO. DAY: DAYO.\n\nPower outage detected in Facility 18. Emergency containment failing soon. Experiments are escaping. If you do not reach the roof, you will die.\n\nYou wake up in the Operating Room. The door is dead-bolted.",
        btn: "SEARCH ROOM"
    },
    {
        type: "puzzle",
        title: "STATION 1: THE OPERATING ROOM (NUMBER)",
        text: "You find a scratched tablet. Solve for the Access Code:\n\n1. What is the value of 1 + [2 / (1 + (2 / (1 + (2 / (1 + 1)))))]?\n2. A number < 100 leaves a remainder of 1 when divided by 3, remainder of 2 when divided by 4, remainder of 3 when divided by 5. What is it?\n3. What is the unit digit of 9^9?\n4. What is the smallest positive integer both a square and a cube (not 0 or 1)?\n\nCODE: [Biggest Answer] - [Sum of all 3 small answers]",
        answer: "-5",
        hints: [
            "1. Work from the bottom to the top.",
            "2. What is 3-1? How about 4-2? How about 5-3? 3x4x5=60. This means 60 is divisible by 3, 4, and 5. How can that help?",
            "3. Find a pattern. What’s the unit digit of 9^1? How about 9^2? How about 9^3?",
            "4. Test cubes. What is 2^3? How about 3^3? How about 4^3? Are any of them squares as well?"
        ]
    },
    {
        type: "lore",
        text: "The Operating Room door slides open. You step into a long, dimly lit hallway. \nA security gate blocking the path requires geometric validation.",
        btn: "ACCESS GATE"
    },
    {
        type: "puzzle",
        title: "STATION 2: THE HALLWAY (GEOMETRY)",
        text: "Triangular sensor detected (Side lengths: 3, 4, 5). \n\nCalculate the Area of the Great Circle (containing all vertices) divided by the Area of the Small Circle (tangent to, or touching all sides), then multiply the result by 1.6.",
        answer: "10",
        visual: '<div style="font-size:3em; text-shadow: 0 0 10px #00ff41;">△</div>',
        hints: [
            "i) Is this a right triangle? If so, why? (Use the Pythagorean Theorem, and draw it out).",
            "ii) This is a hard problem, but the center of the Great Circle is in the middle of the hypotenuse.",
            "iii) Find the area of the triangle two different ways. Base times height, and something else.",
            "iiii) (Radius of Small Circle times Perimeter)/2 equals Area of the Triangle."
        ]
    },
    {
        type: "choice",
        text: "Gate cleared. The hallway splits. To your right, the dark **TUNNELS** lead directly toward the laboratory. To your left, a heavy door labeled **BIOLOGICAL WING** hums with power.",
        choices: [
            { label: "ENTER BIOLOGICAL WING", target: 13 },
            { label: "PROCEED TO TUNNELS", target: 8, id: 'lab'}
        ]
    },
    {
        type: "puzzle",
        title: "STATION 3: THE TECH INTERFACES (LOGIC)",
        text: "One interface always tells the truth, one lies, one is random.\n\nINT 0: 'Int 1 is the liar.'\nINT 1: 'Int 2 is the liar.'\nINT 2: 'I am the liar.'\n\nWhich interface tells the truth? (0, 1, or 2)",
        answer: "0",
        visual: `<div class="interface-group">
            <div class="interface-node">INT 0:<br>"1 is Liar"</div>
            <div class="interface-node">INT 1:<br>"2 is Liar"</div>
            <div class="interface-node">INT 2:<br>"I am Liar"</div>
        </div>`,
        hints: ["Start from Interface 3."]
    },
    {
        type: "lore",
        text: "Interface 0 glows green. A hidden drawer opens, revealing a PHYSICAL SECURITY KEY. You grab it, but the room is a dead end. You must head to the Tunnels.",
        btn: "BACK TO TUNNELS",
        onEntry: () => { hasKey = true; }
    },
    {
        type: "puzzle",
        title: "STATION 4: THE INNER LABORATORY (FRACTIONS)",
        text: "3 hermetically sealed containers of ECGP strands are here. \n\nUse 2/3 of Flask A (5/8), 3/4 of Flask B (7/12), and fraction x of Flask C (3/10) so the total equals exactly 1 vial.\n\nFind x - 1/9, convert to %, round to nearest 10. (If you got XX%, the answer is XX)",
        answer: "40",
        visual: `<div class="vial-container">
            <div class="vial a"><div class="liquid"></div></div>
            <div class="vial b"><div class="liquid"></div></div>
            <div class="vial c"><div class="liquid"></div></div>
        </div>`,
        hints: ["How much ECGP did you take out of Container A? How about Container B? How about Container C? Add them all up and set that equal to 1, then solve for x."]
    },
    {
        type: "lore",
        text: "The giant lab door has a physical keyhole. (Checking for Tech Key...)",
        btn: "USE KEY"
    },
    {
        type: "puzzle",
        title: "STATION 5: THE EXPERIMENT LOGS (DATA)",
        text: "A terminal shows temperature logs: 15, 18, 20, 22, 25, and X. \n\nThe Median and the Mean of all 6 logs must be exactly 20 to avoid a core leak. What is X?",
        answer: "20",
        visual: '<div style="font-size:1.5em; border: 1px dashed #00ff41; padding: 10px;">[15, 18, 20, 22, 25, X]</div>',
        hints: ["i) Use the mean.", "ii) Calculate the mean of the data, then set it equal to 20, then solve for x."]
    },
    {
        type: "puzzle",
        title: "STATION 6: THE ARMORY (ALGEBRA)",
        text: "Experiments are clawing at the door! Forge a shield. \n\nArea must be 75cm². Length must be 10cm longer than width. In cm, what is the length of the SHORTER side?",
        answer: "5",
        visual: '<div style="width:70px; height:90px; border:3px solid #00ff41; margin:auto; background:radial-gradient(#004400, #000);"></div>',
        hints: [
            "i) Let the shorter side be x. What is the longer side? What is the area of the rectangle (length times width)?",
            "ii) You should have an expression for the area of the rectangle now. Set that equal to 75. You can guess and check, or factor 75."
        ]
    },
    {
        type: "puzzle",
        title: "STATION 7: THE ROOF (LOGIC)",
        text: "You reach the roof. The rescue helicopter is circling, but you need the final signal frequency.\n\nPatterns identified in previous codes: [-5, 10, 0, 40, 20, 5, ?]\n\nYou have to arrange it such that the first 4 numbers form an arithmetic sequence(addition pattern) and the last 5 numbers form a geometric sequence(multiplication pattern). What is the 7th term in the pattern?",
        answer: "80",
        hints: [
            "i) Organize your first 6 answers, and try to make an addition pattern and a multiplication pattern.",
            "ii) Once you have the multiplication pattern, what is the common ratio?"
        ]
    },
    {
        type: "choice",
        title: "BIOLOGICAL WING",
        text: "You are inside the Biological Wing. A display panel shows: [CRITICAL ENERGY - 1 DOOR OPENING REMAINING]. <br><br>**Option A: TECH ROOM** (Scanner detects a Security Key inside).<br>**Option B: CONTAINMENT ROOM** (Scanner detects 4 powerful experiments, a Security Key, a Hint, and a 5-minute Experiment Stabilizer vial).",
        choices: [
            { label: "ENTER TECH ROOM", target: 6, id: "tech"},
            { label: "ENTER CONTAINMENT ROOM", target: 14, id: "containment"}
        ]
    },
    {
        type: "puzzle",
        title: "STATION 3.1: THE CONTAINMENT ROOM (LOGIC)",
        text: 'You see 4 chambers labeled 0, 1, 2, 3. On a desk, you see a key, a paper labeled HINT, and a vial inside a glass box. A note on the box reads: “Press the emergency button on the Interface associated with the Mimic experiment to release the lock.” <br><br> Four Interfaces (0, 1, 2, and 3) are mounted on the wall. Interface 0 has been smashed and is completely dark.<br><br> You find a manual saying: <br>1. Only the data log from the Interface belonging to the Level 4 (Maximum Danger) experiment is true. All other  Interfaces provide 100% false data.<br>2. The Stalker is in chamber 1. The experiment in chamber 2 is Level 3.<br> 3. Each chamber (0, 1, 2, 3), Experiment (Mimic, Behemoth, Stalker, Wraith), and Danger Level (1, 2, 3, 4) is used exactly once.<br><br>On the readable interfaces, you see the logs: <br>Interface 1 Log: "The Behemoth is in chamber 3. The Wraith is Level 1."<br>Interface 2 Log: "Interface 1 is Level 4. The Behemoth is in chamber 0."<br>Interface 3 Log: "The Stalker is Level 3. The Behemoth is Level 2."<br>Which Interface number must you press to open the box?',
        answer: "0",
        hints: [
            "i) Identify the truth-telling interface (Level 4). Can INT 1 be Level 4? If it were, then INT 2's claim that INT 1 is Level 4 would be true... but only one interface tells the truth!",
            "ii) Use INT 3 as your starting point. If it is the truth-teller, check if the other interfaces correctly become liars."
        ]
    },
    {
        type: "choice",
        text: "The glass box shatters! You secured the SECURITY KEY, found an EXTRA HINT, and injected the stabilizer vial into the vents. <br><br><strong>[SYSTEM STABILIZED: +5 MINUTES GRANTED]</strong><br><br>In front of you are two tunnels that lead to:<br>1. **THE SLICING ROOM**: A dangerous-looking tunnel, but the scanner dectects an Experiment Stabilizer<br>2. **THE LABORATORY**: Stable and secure.",
        onEntry: () => { 
            if (!visitedIndices.has(15)) {
                hasKey = true; 
                hintCharges++; 
                timeLeft += 5 * 60; 
                triggerAlert("STABILIZER DETECTED: +5 MINUTES", 2);
                visitedIndices.add(15); // Mark as claimed
            }
        },
        choices: [
            { label: "ENTER SLICING ROOM (STATION 4.1)", target: 16, id: 'slicer' },
            { label: "ENTER LABORATORY (STATION 4)", target: 8, id: 'lab' }
        ]
    },
    {
        type: "puzzle",
        title: "STATION 4.1: THE SLICING ROOM (FRACTIONS)",
        text: "Barricade detected. Power the Slicer using Vial D.<br><br>Vial A: 100mL (2/5 acid).<br>Vial B: 5/9 acid, same fuel as Vial A.<br>Vials C+D combined acid = Vial B acid.<br>Vial C: 60mL acid. Vial D: 3/8 acid.<br><br>Acid: Powers 160s per 100mL | Fuel: Powers 64s per 100mL.<br>How many seconds will Vial D run the Slicer?",
        answer: "40",
        hints: [
            "i) Start with Vial A: If 2/5 is acid (40mL), how much is fuel? (60mL).",
            "ii) Vial B has 60mL fuel. If it's 5/9 acid, it must be 4/9 fuel. Use that to find the total acid in B.",
            "iii) Total Acid in D = (Acid in B) - (Acid in C). Once you have Acid in D, use the 3/8 ratio to find the fuel in D.",
            "iv) Calculate run time for Acid and Fuel separately and sum them."
        ]
    },
    {
        type: "lore",
        text: "The Slicer carves a hole through the floor! You drop down, bypassing the main laboratory entirely and landing right in front of the Temperature Terminal.<br><br><strong>[SYSTEM STABILIZED: +5 MINUTES GRANTED]</strong>",
        btn: "ACCESS TERMINAL",
        onEntry: () => { 
            if (!visitedIndices.has(17)) {
                timeLeft += 5 * 60; 
                triggerAlert("STABILIZER DETECTED: +5 MINUTES", 2);
                visitedIndices.add(17); // Mark as claimed
            }
        }
    }
];

let timeLeft = 30 * 60;
let timerInterval;

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const clockDisplay = document.getElementById('clock');
        clockDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeLeft === 15 * 60) triggerAlert("WARNING: 15 MINUTES UNTIL BIOLOGICAL BREACH.", 3);
        else if (timeLeft === 10 * 60) {
            triggerAlert("CRITICAL: 10 MINUTES REMAINING. ACTIVATE SHIELDS.", 3);
            clockDisplay.className = "warning-yellow";
        } 
        else if (timeLeft === 5 * 60) {
            triggerAlert("ULTIMATE DANGER: 5 MINUTES. SYSTEM FAILURE IMMINENT.", 3);
            clockDisplay.className = "warning-red";
            document.body.classList.add('emergency-panic-mode');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.body.classList.remove('emergency-panic-mode');
            handleFailure();
        }
    }, 1000);
}

function triggerAlert(text, flashCount = 1) {
    const msg = document.getElementById('feedback-msg');
    msg.innerHTML = `<div class="system-alert">${text}</div>`;
    let flashes = 0;
    const flashInterval = setInterval(() => {
        document.body.classList.add('flash-red');
        setTimeout(() => document.body.classList.remove('flash-red'), 300);
        flashes++;
        if (flashes >= flashCount) clearInterval(flashInterval);
    }, 600);
    setTimeout(() => { if (msg.innerHTML.includes("system-alert")) msg.innerHTML = ""; }, 10000);
}

function handleFailure() {
    const lastRoom = content[currentIdx].title || "STATION 1: THE OPERATING ROOM (NUMBER)";
    document.getElementById('terminal-screen').innerHTML = `
        <div style="text-align:center; padding-top:80px; color: #ff0000; font-family: 'Courier New', monospace;">
            <h1 style="font-size:4em; text-shadow: 0 0 20px #ff0000;">BREACH DETECTED</h1>
            <p style="font-size:1.5em; letter-spacing: 2px;">STATUS: CRITICAL FAILURE</p>
            <p>You were lost in: <br> <span style="color: #fff; background: #ff0000; padding: 5px;">${lastRoom}</span></p>
            <button onclick="location.reload()" style="background: #ff0000; color: #fff; border: none; padding: 15px 30px; cursor: pointer; margin-top:30px;">REBOOT</button>
        </div>`;
    document.getElementById('footer').style.display = "none";
}
function render() {
    const screen = document.getElementById('content-area');
    const msg = document.getElementById('feedback-msg');
    const actionBtn = document.getElementById('action-btn');
    const nextBtn = document.getElementById('next-btn');
    const backBtn = document.getElementById('back-btn');
    const data = content[currentIdx];
    
    currentHintIdx = 0; 
    if (!data) { showFinalScreen(); return; }
    if (data.onEntry) data.onEntry();

    msg.innerText = "";
    document.getElementById('hint-display').classList.add('hidden');
    nextBtn.classList.add('hidden');
    backBtn.style.visibility = currentIdx > 0 ? "visible" : "hidden";

    // --- BLOCK 1: MODE SELECT ---
    if (data.type === "mode-select") {
        screen.innerHTML = `<h3>${data.text}</h3><div id="choice-area"></div>`;
        data.choices.forEach(c => {
            const b = document.createElement('button');
            b.innerText = c.label;
            b.onclick = () => { 
                hintCharges = c.charges; 
                timeLeft = c.time * 60; 
                document.getElementById('difficulty-display').innerText = `MODE: ${c.mode}`; 
                updateHintUI(); 
                currentIdx++; 
                startTimer(); 
                render(); 
            };
            screen.querySelector('#choice-area').appendChild(b);
        });
        actionBtn.style.display = "none";
        backBtn.style.visibility = "hidden";
    } 
    // --- BLOCK 2: LORE ---
    else if (data.type === "lore") {
        screen.innerHTML = `<div class="lore-text">${data.text.replace(/\n/g, '<br>')}</div>`;
        actionBtn.style.display = "block";
        actionBtn.innerText = data.btn;
        actionBtn.onclick = () => {
            if (currentIdx === 9 && !hasKey) {
                msg.innerHTML = `<span class="denied-text">KEY REQUIRED: ACCESS DENIED</span>`;
            } 
            else if (currentIdx === 17) { 
                currentIdx = 10; // Slicer Shortcut to Logs
                render(); 
            } 
            else if (currentIdx === 7) {
                currentIdx = 8; // Tech Room back to Lab
                render();
            }
            else { 
                currentIdx++; 
                render(); 
            }
        };
    } 
    // --- BLOCK 3: CHOICE (The Logic You Needed) ---
    else if (data.type === "choice") {
        actionBtn.style.display = "none";
        screen.innerHTML = `<p>${data.text}</p><div id="choice-area"></div>`;
        
        data.choices.forEach(c => {
            const b = document.createElement('button');
            
            // Check for Bio-Wing Lockout (Tech vs Containment)
            const isBioLocked = bioWingSelection && bioWingSelection !== c.id && currentIdx === 13;
            // Check for Path Lockout (Lab vs Slicer)
            const isPathLocked = lockedPath && lockedPath !== c.id && (c.id === 'lab' || c.id === 'slicer');

            if (isBioLocked || isPathLocked) {
                b.disabled = true;
                b.classList.add('btn-disabled');
                b.innerText = isPathLocked ? (c.id === 'lab' ? "LAB (CAVED IN)" : "SLICER (SEALED)") : c.label + " (LOCKED)";
            } else {
                b.innerText = c.label;
                b.onclick = () => { 
                    if (currentIdx === 13) bioWingSelection = c.id; 
                    if (c.id === 'lab') lockedPath = 'lab';
                    if (c.id === 'slicer') lockedPath = 'slicer';
                    currentIdx = c.target; 
                    render(); 
                };
            }
            screen.querySelector('#choice-area').appendChild(b);
        });
    } 
    // --- BLOCK 4: PUZZLES ---
    else {
        const isSolved = solvedIndices.has(currentIdx);
        const isLocked = (lockoutEndTime - Date.now()) > 0;
        screen.innerHTML = `<h3>${data.title}</h3><p>${data.text.replace(/\n/g, '<br>')}</p>${data.visual || ''}
            <div id="input-area">
                <input type="text" id="ans" placeholder="${isSolved ? 'CLEARED' : 'ENTER CODE...'}" ${isSolved ? 'disabled' : ''}>
                <button onclick="check()" ${isSolved ? 'disabled' : ''}>AUTH</button>
            </div>`;
        actionBtn.style.display = "none";
    
        if (!isSolved && isLocked) {
            // Immediately disable so there's no window to type/submit before the timer kicks in
            const ansInput = document.getElementById('ans');
            const authBtn = document.querySelector('#input-area button');
            if (ansInput) ansInput.disabled = true;
            if (authBtn) { authBtn.disabled = true; authBtn.classList.add('btn-disabled'); }
            startLockoutTimer();
        }
        if (isSolved) { msg.innerHTML = `<span class="auth-text">AUTHENTICATED</span>`; nextBtn.classList.remove('hidden'); }
    }
    
    updateHintUI();
}
function check() {
    const input = document.getElementById('ans');
    const msg = document.getElementById('feedback-msg');
    const authBtn = document.querySelector('#input-area button');

    if (input.value.trim() === content[currentIdx].answer) {
        msg.innerHTML = `<span class="auth-text">AUTHENTICATED</span>`;
        solvedIndices.add(currentIdx);
        input.disabled = true;
        if (currentIdx === 12) {
            setTimeout(showFinalScreen, 1500);
        } else {
            document.getElementById('next-btn').classList.remove('hidden');
        }
    } else {
        const penaltyTime = (currentIdx === 14) ? 45 : 20;
lockoutEndTime = Date.now() + (penaltyTime * 1000);
startLockoutTimer(); // No need to pass arguments
    }
}
function startLockoutTimer() {
    const input = document.getElementById('ans');
    const authBtn = document.querySelector('#input-area button');
    const msg = document.getElementById('feedback-msg');

    if (!input || !authBtn) return;

    // CRITICAL: Stop any "ghost" timers currently running
    if (activeLockoutInterval) clearInterval(activeLockoutInterval);

    input.disabled = true;
    authBtn.disabled = true;
    authBtn.classList.add('btn-disabled');

    activeLockoutInterval = setInterval(() => {
        const remaining = Math.ceil((lockoutEndTime - Date.now()) / 1000);
        
        if (remaining <= 0) {
            clearInterval(activeLockoutInterval);
            activeLockoutInterval = null;
            
            // Only re-enable if we are still on a puzzle screen
            if (document.getElementById('ans')) {
                document.getElementById('ans').disabled = false;
                document.querySelector('#input-area button').disabled = false;
                document.querySelector('#input-area button').classList.remove('btn-disabled');
                msg.innerText = "";
            }
            lockoutEndTime = 0; 
        } else {
            msg.innerHTML = `<span class="denied-text">ACCESS DENIED. SYSTEM LOCKED FOR ${remaining}s</span>`;
        }
    }, 1000);
}
function updateHintUI() {
    const counter = document.getElementById('stats-panel'); // Target the panel
    const hintArea = document.getElementById('hint-count');
    
    let html = `HINTS: ${hintCharges} `;
    
    // Only show button if charges exist OR if they've already started 
    // revealing hints in the current room
    const isShowingHints = !document.getElementById('hint-display').classList.contains('hidden');
    const hasMoreHints = content[currentIdx].hints && currentHintIdx < content[currentIdx].hints.length;

    if (hasMoreHints && (hintCharges > 0 || isShowingHints)) {
        const btnLabel = isShowingHints ? "NEXT HINT (FREE)" : "REQUEST HINT";
        html += `<button class="hint-btn" onclick="requestHint()">${btnLabel}</button>`;
    }
    
    hintArea.innerHTML = html;
}
function requestHint() {
    const display = document.getElementById('hint-display');
    const hints = content[currentIdx].hints;

    if (!hints) return;

    // If first time clicking in this room, consume a charge
    if (display.classList.contains('hidden')) {
        if (hintCharges <= 0) return;
        hintCharges--;
        display.classList.remove('hidden');
        display.innerHTML = `[DECRYPTED HINT 1]:<br>${hints[0]}`;
        currentHintIdx = 1;
    } 
    // If already revealed, just show the next one for free
    else if (currentHintIdx < hints.length) {
        display.innerHTML += `<br><br>[DECRYPTED HINT ${currentHintIdx + 1}]:<br>${hints[currentHintIdx]}`;
        currentHintIdx++;
    }

    updateHintUI();
}
function advance() { currentIdx++; render(); }
function skip() { currentIdx++; render(); }
function goBack() { 
    // From Lab (8) or Bio-Wing choice (13), go back to Hallway split (5)
    if (currentIdx === 8 || currentIdx === 13) {
        currentIdx = 5;
    }
    // From Tech Room (6) or 3.1 (14), go back to Bio-Wing choice (13)
    else if (currentIdx === 6 || currentIdx === 14) {
        currentIdx = 13;
    }
    // From Slicer (16) or Lab-after-3.1 (8), go back to the collapse choice (15)
    else if (currentIdx === 16 || (currentIdx === 8 && bioWingSelection === 'containment')) {
        currentIdx = 15;
    }
    // FIX: From Station 5 (10), check how we got there
    else if (currentIdx === 10) {
        if (lockedPath === 'slicer') {
            currentIdx = 17; // Go back to Slicer Lore
        } else {
            currentIdx = 9;  // Go back to Lab Key Check
        }
    }
    // General linear back navigation
    else if (currentIdx > 1) {
        currentIdx--; 
    }
    render(); 
}

function showFinalScreen() {
    clearInterval(timerInterval);
    document.getElementById('terminal-screen').innerHTML = `<div style="text-align:center; padding-top:50px;"><h1>CONGRATULATIONS.</h1><p>RESCUE HELICOPTER ARRIVED. YOU ARE SAFE.</p></div>`;
    document.getElementById('footer').style.display = "none";
}

window.onload = render;
document.addEventListener('contextmenu', event => event.preventDefault());

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey; // metaKey handles Command on Mac

    if (
        (ctrl && (key === 'c' || key === 'v' || key === 'x' || key === 'u')) || 
        key === 'f12'
    ) {
        e.preventDefault();
        // Optional: Trigger a small system alert so they know why it's blocked
        triggerAlert("SYSTEM ERROR: CLIPBOARD ACCESS RESTRICTED", 1);
        return false;
    }
});

document.body.style.userSelect = "none";
