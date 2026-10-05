const maxPassengers = 8;
let passengerCount = 1;
let ticketPrice = 0;

const selectedDayLabels = document.querySelectorAll(
    '.days-display label'
);

const passengersList = document.getElementById(
    'passengersList'
);

const addPassengerBtn = document.getElementById(
    'addPassenger'
);

const ticketRadios = document.querySelectorAll(
    'input[name="ticketClass"]'
);

// Update summary displays
const selectedTicketName = document.getElementById(
    'selectedTicketName'
);

const passengerCountDisplay = document.getElementById(
    'passengerCount'
);

const pricePerTicket = document.getElementById(
    'pricePerTicket'
);

const totalAmount = document.getElementById(
    'totalAmount'
);

const updateSummary = () => {
    passengerCountDisplay.textContent = passengerCount;

    pricePerTicket.textContent =
        `¥${ticketPrice.toLocaleString()}`;

    const total = ticketPrice * passengerCount;

    totalAmount.textContent =
        `¥${total.toLocaleString()}`;
};

const updatePassengerNumbers = () => {
    const cards = document.querySelectorAll(
        '.passenger-card'
    );

    cards.forEach((card, index) => {
        card.querySelector(
            '.passenger-number'
        ).textContent = `Passenger ${index + 1}`;
    });
};

const createRemoveButton = () => {
    const btn = document.createElement('button');

    btn.type = 'button';
    btn.className = 'btn-remove-passenger';
    btn.innerHTML = '<span class="remove-icon">×</span>';
    btn.setAttribute(
        'aria-label',
        'Remove passenger'
    );

    return btn;
};

const addPassenger = () => {
    if (passengerCount >= maxPassengers) {
        alert(
            `Maximum of ${maxPassengers} passengers allowed per booking`
        );

        return;
    }

    const passengerCard =
        document.createElement('div');

    passengerCard.className = 'passenger-card';

    passengerCard.setAttribute(
        'data-passenger-index',
        passengerCount
    );

    passengerCard.innerHTML = `
        <div class="passenger-card-header">
            <h3 class="passenger-number">
                Passenger ${passengerCount + 1}
            </h3>
        </div>

        <div class="form-grid">
            <div class="form-group">
                <label
                    for="firstName-${passengerCount}"
                    class="form-label"
                >
                    First Name
                </label>

                <input
                    type="text"
                    id="firstName-${passengerCount}"
                    name="passengers[${passengerCount}][firstName]"
                    class="form-input"
                    required
                    placeholder="Enter first name"
                >
            </div>

            <div class="form-group">
                <label
                    for="lastName-${passengerCount}"
                    class="form-label"
                >
                    Last Name
                </label>

                <input
                    type="text"
                    id="lastName-${passengerCount}"
                    name="passengers[${passengerCount}][lastName]"
                    class="form-input"
                    required
                    placeholder="Enter last name"
                >
            </div>

            <div class="form-group">
                <label
                    for="email-${passengerCount}"
                    class="form-label"
                >
                    Email Address
                </label>

                <input
                    type="email"
                    id="email-${passengerCount}"
                    name="passengers[${passengerCount}][email]"
                    class="form-input"
                    required
                    placeholder="your.email@example.com"
                >
            </div>

            <div class="form-group">
                <label
                    for="phone-${passengerCount}"
                    class="form-label"
                >
                    Phone Number
                </label>

                <input
                    type="tel"
                    id="phone-${passengerCount}"
                    name="passengers[${passengerCount}][phone]"
                    class="form-input"
                    required
                    placeholder="+81 90-1234-5678"
                >
            </div>
        </div>
    `;

    const removeBtn = createRemoveButton();

    passengerCard
        .querySelector('.passenger-card-header')
        .appendChild(removeBtn);

    passengersList.appendChild(passengerCard);

    passengerCount++;

    updateSummary();
    updateAddButtonState();
    addRemoveAllButtons();
};

const removePassenger = (card) => {
    if (passengerCount <= 1) {
        alert('At least one passenger is required');

        return;
    }

    card.remove();

    passengerCount--;

    updatePassengerNumbers();
    updateSummary();
    updateAddButtonState();
    addRemoveAllButtons();
};

const updateAddButtonState = () => {
    if (passengerCount >= maxPassengers) {
        addPassengerBtn.disabled = true;
        addPassengerBtn.classList.add('disabled');
    } else {
        addPassengerBtn.disabled = false;
        addPassengerBtn.classList.remove('disabled');
    }
};

const addRemoveAllButtons = () => {
    const firstCard = document.querySelector(
        '.passenger-card'
    );

    const existingBtn = firstCard.querySelector(
        '.btn-remove-passenger'
    );

    if (passengerCount > 1 && !existingBtn) {
        const removeBtn = createRemoveButton();

        firstCard
            .querySelector('.passenger-card-header')
            .appendChild(removeBtn);
    } else if (
        passengerCount === 1 &&
        existingBtn
    ) {
        existingBtn.remove();
    }
};

const autoFillForm = () => {
    const westernFirstNames = [
        'James',
        'Olivia',
        'William',
        'Emily',
        'Charlotte',
        'George',
        'Anna',
        'Henry'
    ];

    const westernLastNames = [
        'Smith',
        'Johnson',
        'Brown',
        'Taylor',
        'Wilson',
        'Evans',
        'Clark',
        'Davis'
    ];

    const japaneseFirstNames = [
        'Yuki',
        'Haruto',
        'Sakura',
        'Akira',
        'Hana',
        'Kenji',
        'Aoi',
        'Takeshi'
    ];

    const japaneseLastNames = [
        'Tanaka',
        'Suzuki',
        'Yamamoto',
        'Watanabe',
        'Ito',
        'Nakamura',
        'Kobayashi',
        'Sato'
    ];

    const randomItem = (arr) =>
        arr[Math.floor(Math.random() * arr.length)];

    const randInt = (min, max) =>
        Math.floor(
            Math.random() * (max - min + 1)
        ) + min;

    const cards = document.querySelectorAll(
        '.passenger-card'
    );

    cards.forEach((card, index) => {
        const i = card.dataset.passengerIndex
            ? Number(card.dataset.passengerIndex)
            : index;

        // 30% chance for Japanese name
        const isJapanese = Math.random() < 0.30;

        const firstName = randomItem(
            isJapanese
                ? japaneseFirstNames
                : westernFirstNames
        );

        const lastName = randomItem(
            isJapanese
                ? japaneseLastNames
                : westernLastNames
        );

        const firstNameInput = card.querySelector(
            `#firstName-${i}`
        );

        const lastNameInput = card.querySelector(
            `#lastName-${i}`
        );

        const emailInput = card.querySelector(
            `#email-${i}`
        );

        const phoneInput = card.querySelector(
            `#phone-${i}`
        );

        if (firstNameInput) {
            firstNameInput.value = firstName;
        }

        if (lastNameInput) {
            lastNameInput.value = lastName;
        }

        if (emailInput) {
            emailInput.value =
                `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(
                    10,
                    99
                )}@example.com`;
        }

        if (phoneInput) {
            if (isJapanese) {
                // Japanese fictional number for testing
                phoneInput.value =
                    `+81 120-${randInt(
                        100,
                        999
                    )}-${randInt(1000, 9999)}`;
            } else if (Math.random() < 0.5) {
                // US fictional number for testing
                phoneInput.value =
                    `+1 555-01${String(
                        randInt(10, 99)
                    ).padStart(
                        2,
                        '0'
                    )}-${randInt(1000, 9999)}`;
            } else {
                // UK fictional number for testing
                phoneInput.value =
                    `+44 1632 960${String(
                        randInt(100, 999)
                    )}`;
            }
        }
    });

    console.log(
        `✓ Filled ${cards.length} passenger form(s)`
    );
};

// Update ticket availability based on the selected day
const updateTicketAvailability = async (day) => {
    try {
        const response = await fetch(
            `/api/ticket-classes?day=${encodeURIComponent(
                day.toLowerCase()
            )}`
        );

        if (!response.ok) {
            throw new Error(
                `API request failed: ${response.status}`
            );
        }

        const availableTicketClasses =
            await response.json();

        const availableClasses = new Set(
            availableTicketClasses.map(
                (ticketClass) =>
                    ticketClass.class
            )
        );

        ticketRadios.forEach((radio) => {
            const ticketCard =
                radio.closest('.ticket-card');

            const isAvailable =
                availableClasses.has(
                    radio.value
                );

            radio.disabled = !isAvailable;

            if (ticketCard) {
                ticketCard.classList.toggle(
                    'unavailable',
                    !isAvailable
                );
            }

            if (!isAvailable) {
                radio.checked = false;
            }
        });

        // Select the first available ticket if necessary
        const selectedRadio =
            document.querySelector(
                'input[name="ticketClass"]:checked'
            );

        if (!selectedRadio) {
            const firstAvailableRadio =
                Array.from(ticketRadios).find(
                    (radio) => !radio.disabled
                );

            if (firstAvailableRadio) {
                firstAvailableRadio.checked = true;

                firstAvailableRadio.dispatchEvent(
                    new Event('change')
                );
            }
        }
    } catch (error) {
        console.error(
            'Error retrieving ticket-class availability:',
            error
        );
    }
};

// Event listeners for day selection
selectedDayLabels.forEach((label) => {
    const dayInput = label.querySelector('input');

    dayInput.addEventListener(
        'change',
        async () => {
            selectedDayLabels.forEach((lbl) => {
                lbl.classList.remove(
                    'selected'
                );
            });

            label.classList.add('selected');

            await updateTicketAvailability(
                dayInput.value
            );
        }
    );
});

// Add passenger
addPassengerBtn.addEventListener(
    'click',
    addPassenger
);

// Remove passenger
passengersList.addEventListener(
    'click',
    (e) => {
        const removeBtn =
            e.target.closest(
                '.btn-remove-passenger'
            );

        if (removeBtn) {
            const card =
                removeBtn.closest(
                    '.passenger-card'
                );

            removePassenger(card);
        }
    }
);

// Ticket selection
ticketRadios.forEach((radio) => {
    radio.addEventListener(
        'change',
        (e) => {
            e.preventDefault();

            const selected =
                e.currentTarget;

            // Update visual and input selection
            ticketRadios.forEach(
                (input) => {
                    input.checked = false;
                    input.removeAttribute(
                        'checked'
                    );
                }
            );

            selected.checked = true;

            selected.setAttribute(
                'checked',
                true
            );

            // Update summary
            const ticketName =
                selected.dataset.name;

            ticketPrice = parseInt(
                selected.dataset.price,
                10
            );

            selectedTicketName.textContent =
                ticketName;

            updateSummary();
        }
    );
});

// Auto-fill passenger forms
document
    .getElementById('autofill')
    .addEventListener(
        'click',
        (e) => {
            e.preventDefault();

            autoFillForm();
        }
    );

// Initialize ticket based on default selection
const selectedRadio = document.querySelector(
    'input[name="ticketClass"]:checked'
);

if (selectedRadio) {
    const ticketName =
        selectedRadio.dataset.name;

    selectedTicketName.textContent =
        ticketName;

    ticketPrice = parseInt(
        selectedRadio.dataset.price,
        10
    );
}

updateSummary();

// Initialize passenger controls
updateAddButtonState();
addRemoveAllButtons();

// Initialize ticket availability
const initialDay = document.querySelector(
    'input[name="selectedDay"]:checked'
);

if (initialDay) {
    updateTicketAvailability(
        initialDay.value
    );
}