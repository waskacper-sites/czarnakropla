/* ==========================================================================
   CZARNA KROPLA TATTOO & PIERCING - Główny Skrypt Strony Pokazowej
   Tarnów, ul. Kaczkowskiego 7/6 | Tel: 576 889 793
   ========================================================================== */

const CONFIG = {
    BRAND_NAME: "Czarna Kropla Tattoo & Piercing",
    STUDIO_PHONE: "576 889 793",
    STUDIO_EMAIL: "czarnakropla.tattooshop@gmail.com",
    STUDIO_LOCATION: "Kaczkowskiego 7/6, 33-100 Tarnów",
    INSTAGRAM_URL: "https://www.instagram.com/czarnakropla.tattoo/",
    HOURS_WEEKDAYS: "Pn – Pt: 10:00 – 17:00",
    HOURS_SATURDAY: "Sobota: 10:00 – 15:00",
    HOURS_SUNDAY: "Niedziela: ZAMKNIĘTE",
    LOCAL_STORAGE_KEY: "czarnakropla_bookings",
    LOCAL_STORAGE_HISTORY_KEY: "czarnakropla_bookings_history",
    DEMO_ADMIN_EMAIL: "admin@czarnakropla.pl",
    DEMO_ADMIN_PASS: "admin123"
};

/* === STAN APLIKACJI I KALENDARZA === */
const todayDate = new Date();
const currentRealYear = todayDate.getFullYear();
const currentRealMonth = todayDate.getMonth(); // 0-11
const currentRealDay = todayDate.getDate();

let calendarYear = currentRealYear;
let calendarMonth = currentRealMonth;

let bookingState = {
    step: 1,
    selectedServiceKey: 'fineline',
    selectedServiceName: 'Fine-line & Botanika',
    selectedDate: null,
    selectedTime: null
};

let uploadedInspirationFiles = [];

const servicesData = {
    'fineline': { name: 'Fine-line & Botanika', desc: 'Subtelne linie, mikrotatuaże, motywy roślinne i florystyczne' },
    'blackwork': { name: 'Blackwork & Grafika', desc: 'Mocna głęboka czerń, błyskawice, ostre kontury i mroczna grafika' },
    'neotrad': { name: 'Neo-traditional & Flash', desc: 'Kreatywne autorskie wzory, serca, motywy ignorant i retro' },
    'piercing': { name: 'Piercing Profesjonalny', desc: 'Bezpieczne, precyzyjne przekłucia w sterylnych warunkach' },
    'konsultacja': { name: 'Konsultacja & Projekt Autorski', desc: 'Wspólne omówienie pomysłu i dopasowanie kompozycji' }
};

// Godziny pracy studia zależne od dnia tygodnia:
// Pn-Pt (1-5): 10:00 - 17:00
// Sobota (6): 10:00 - 15:00
// Niedziela (0): Zamknięte
function getTimeSlotsForDate(dateStr) {
    if (!dateStr) return ['10:00', '12:00', '14:00', '15:30'];
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 6) {
        // Sobota
        return ['10:00', '11:30', '13:00', '14:00'];
    }
    // Dni powszednie
    return ['10:00', '11:30', '13:30', '15:30'];
}

const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

/* === OGRANICZENIA KALENDARZA === */
function getMinCalendarMonth() {
    let m = currentRealMonth - 1;
    let y = currentRealYear;
    if (m < 0) { m = 11; y--; }
    return { month: m, year: y };
}

function getMaxCalendarMonth() {
    let m = currentRealMonth + 7;
    let y = currentRealYear;
    while (m > 11) { m -= 12; y++; }
    return { month: m, year: y };
}

function getMaxBookingLimitDate() {
    const d = new Date(todayDate);
    d.setMonth(d.getMonth() + 6);
    return d;
}

function canScrollPrev() {
    const min = getMinCalendarMonth();
    return (calendarYear > min.year) || (calendarYear === min.year && calendarMonth > min.month);
}

function canScrollNext() {
    const max = getMaxCalendarMonth();
    return (calendarYear < max.year) || (calendarYear === max.year && calendarMonth < max.month);
}

/* === KODY KRAJÓW / PREFIX TELEFONICZNY === */
const countryList = [
    { code: '+48', iso: 'pl', name: 'Polska' },
    { code: '+44', iso: 'gb', name: 'United Kingdom' },
    { code: '+49', iso: 'de', name: 'Deutschland' },
    { code: '+31', iso: 'nl', name: 'Nederland' },
    { code: '+47', iso: 'no', name: 'Norge' },
    { code: '+353', iso: 'ie', name: 'Ireland' },
    { code: '+380', iso: 'ua', name: 'Україна' },
    { code: '+420', iso: 'cz', name: 'Česko' },
    { code: '+43', iso: 'at', name: 'Österreich' },
    { code: '+41', iso: 'ch', name: 'Schweiz' },
    { code: '+1', iso: 'us', name: 'USA / Canada' }
];

let selectedCountry = countryList[0];

function renderCountryOptions(filterText = '') {
    const listContainer = document.getElementById('country-options-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    const q = (filterText || '').toLowerCase().trim();
    const filtered = countryList.filter(c => c.name.toLowerCase().includes(q) || c.code.includes(q) || c.iso.includes(q));
    if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="text-xs text-gray-400 py-3 text-center">Brak wyników</div>';
        return;
    }
    filtered.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-100 transition rounded-lg text-neutral-800';
        btn.innerHTML = `
            <span class="flex items-center gap-2">
                <span class="fi fi-${c.iso}"></span>
                <span class="font-medium">${c.name}</span>
            </span>
            <span class="font-mono text-neutral-500 font-semibold">${c.code}</span>
        `;
        btn.onclick = () => selectCountry(c);
        listContainer.appendChild(btn);
    });
}

function selectCountry(country) {
    selectedCountry = country;
    const flagEl = document.getElementById('selected-country-flag');
    const codeEl = document.getElementById('selected-country-code');
    if (flagEl) flagEl.className = `fi fi-${country.iso}`;
    if (codeEl) codeEl.innerText = country.code;
    toggleCountryDropdown(false);
}

function toggleCountryDropdown(forceState) {
    const dropdown = document.getElementById('country-dropdown-menu');
    if (!dropdown) return;
    if (typeof forceState === 'boolean') {
        if (forceState) dropdown.classList.remove('hidden');
        else dropdown.classList.add('hidden');
    } else {
        dropdown.classList.toggle('hidden');
    }
    if (!dropdown.classList.contains('hidden')) {
        renderCountryOptions('');
        const searchInput = document.getElementById('country-search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
    }
}

/* === UNIWERSALNY SYSTEM MODALI === */
function showCustomModal({ title, message, type = 'info', confirmText = 'OK', cancelText = null, onConfirm = null, onCancel = null }) {
    const backdrop = document.getElementById('custom-modal-backdrop');
    const card = document.getElementById('custom-modal-card');
    const iconContainer = document.getElementById('custom-modal-icon-container');
    const titleEl = document.getElementById('custom-modal-title');
    const bodyEl = document.getElementById('custom-modal-body');
    const confirmBtn = document.getElementById('custom-modal-confirm-btn');
    const cancelBtn = document.getElementById('custom-modal-cancel-btn');

    if (!backdrop || !card) return;

    if (titleEl) titleEl.innerHTML = title;
    if (bodyEl) bodyEl.innerHTML = message;
    if (confirmBtn) confirmBtn.innerHTML = confirmText;

    if (iconContainer) {
        if (type === 'success') {
            iconContainer.className = 'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-md bg-emerald-50 text-emerald-600 border border-emerald-200';
            iconContainer.innerHTML = '<i class="fa-solid fa-check"></i>';
        } else if (type === 'error') {
            iconContainer.className = 'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-md bg-rose-50 text-rose-600 border border-rose-200';
            iconContainer.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        } else {
            iconContainer.className = 'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-xl shadow-md bg-amber-50 text-[#c5a059] border border-amber-200/60';
            iconContainer.innerHTML = '<i class="fa-solid fa-droplet"></i>';
        }
    }

    if (cancelBtn) {
        if (cancelText) {
            cancelBtn.innerText = cancelText;
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }
    }

    const closeModal = () => {
        card.classList.remove('scale-100', 'opacity-100');
        card.classList.add('scale-95', 'opacity-0');
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0');
        setTimeout(() => {
            backdrop.classList.remove('flex');
            backdrop.classList.add('hidden');
        }, 300);
    };

    if (confirmBtn) {
        confirmBtn.onclick = () => {
            closeModal();
            if (onConfirm) onConfirm();
        };
    }
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            closeModal();
            if (onCancel) onCancel();
        };
    }

    const closeBtn = document.getElementById('custom-modal-close-btn');
    if (closeBtn) closeBtn.onclick = closeModal;

    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        card.classList.remove('scale-95', 'opacity-0');
        card.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function showCustomAlert(title, message, type = 'info') {
    showCustomModal({ title, message, type });
}

function copyContactEmail(btn) {
    const email = 'kacperekwas1@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check text-emerald-600"></i> <span class="text-emerald-600">Skopiowano!</span>';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
        }
    }).catch(() => {
        window.prompt('Skopiuj adres e-mail:', email);
    });
}

function openContactOwnerModal() {
    const content = `
        <div class="space-y-4">
            <p class="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                Chcesz wdrożyć nowoczesną stronę internetową z systemem rezerwacji online dla swojego salonu lub firmy? Skontaktuj się ze mną bezpośrednio:
            </p>
            <div class="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#c5a059] text-lg flex-shrink-0">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                    <div>
                        <div class="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">Adres E-mail</div>
                        <a href="mailto:kacperekwas1@gmail.com" class="text-base sm:text-lg text-neutral-900 font-mono font-bold hover:text-[#c5a059] transition select-all">kacperekwas1@gmail.com</a>
                    </div>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto">
                    <button type="button" onclick="copyContactEmail(this)" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                        <i class="fa-regular fa-copy"></i> <span>Kopiuj</span>
                    </button>
                    <a href="mailto:kacperekwas1@gmail.com" class="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-paper-plane"></i> <span>Napisz</span>
                    </a>
                </div>
            </div>
            <p class="text-xs text-neutral-500 font-normal">
                Odpowiadam na wiadomości najczęściej w ciągu kilkunastu godzin. Chętnie omówię szczegóły i przygotuję indywidualną wycenę.
            </p>
        </div>
    `;

    showCustomModal({
        title: 'Skontaktuj Się w Sprawie Strony',
        message: content,
        type: 'info',
        confirmText: 'Zamknij'
    });
}

/* === LOGIKA REZERWACJI (4 KROKI Z PŁYNNĄ ANIMACJĄ) === */
function selectService(serviceKey) {
    const data = servicesData[serviceKey];
    if (!data) return;
    bookingState.selectedServiceKey = serviceKey;
    bookingState.selectedServiceName = data.name;

    document.querySelectorAll('[id^="service-option-"]').forEach(el => {
        el.classList.remove('border-[#c5a059]', 'bg-amber-50/40', 'ring-2', 'ring-[#c5a059]/30');
        el.classList.add('border-neutral-200', 'bg-white');
    });

    const activeEl = document.getElementById(`service-option-${serviceKey}`);
    if (activeEl) {
        activeEl.classList.remove('border-neutral-200', 'bg-white');
        activeEl.classList.add('border-[#c5a059]', 'bg-amber-50/40', 'ring-2', 'ring-[#c5a059]/30');
    }
}

function goToBookingStep(step) {
    if (step === 2 && !bookingState.selectedServiceKey) {
        showCustomAlert('Wybierz Usługę', 'Prosimy najpierw wskazać interesujący styl tatuażu lub piercing.', 'error');
        return;
    }
    if (step === 3 && (!bookingState.selectedDate || !bookingState.selectedTime)) {
        showCustomAlert('Wybierz Datę i Godzinę', 'Prosimy wskazać dostępny dzień w kalendarzu oraz godzinę wizyty.', 'error');
        return;
    }

    if (step === 4) {
        let hasError = false;
        const name = (document.getElementById('booking-client-name')?.value || '').trim();
        const phone = (document.getElementById('booking-client-phone')?.value || '').trim();
        const email = (document.getElementById('booking-client-email')?.value || '').trim();
        const placement = (document.getElementById('booking-tattoo-placement')?.value || '').trim();

        if (!name) {
            showCustomAlert('Podaj Imię i Nazwisko', 'Prosimy uzupełnić swoje imię i nazwisko.', 'error');
            return;
        }

        const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
        const phoneErr = document.getElementById('phone-error-msg');
        if (!phoneDigits || phoneDigits.length < 7) {
            if (phoneErr) phoneErr.classList.remove('hidden');
            hasError = true;
        } else {
            if (phoneErr) phoneErr.classList.add('hidden');
        }

        const emailErr = document.getElementById('email-error-msg');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            if (emailErr) emailErr.classList.remove('hidden');
            hasError = true;
        } else {
            if (emailErr) emailErr.classList.add('hidden');
        }

        if (!placement) {
            showCustomAlert('Miejsce na Ciele', 'Prosimy wskazać planowane miejsce tatuażu lub piercingu (np. przedramię, obojczyk).', 'error');
            return;
        }

        if (hasError) return;

        // Podsumowanie
        const sumService = document.getElementById('summary-service-text');
        const sumDateTime = document.getElementById('summary-datetime-text');
        const sumClient = document.getElementById('summary-client-name');
        const sumPlacement = document.getElementById('summary-placement-text');
        const sumContact = document.getElementById('summary-contact-text');
        const sumImages = document.getElementById('summary-images-text');

        if (sumService) sumService.innerText = bookingState.selectedServiceName;
        if (sumDateTime) sumDateTime.innerText = `${bookingState.selectedDate} o godz. ${bookingState.selectedTime}`;
        if (sumClient) sumClient.innerText = name;
        if (sumPlacement) sumPlacement.innerText = placement;
        if (sumContact) sumContact.innerText = `${selectedCountry.code} ${phone} | ${email}`;
        if (sumImages) sumImages.innerText = `${uploadedInspirationFiles.length} szt.`;
    }

    bookingState.step = step;

    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`booking-step-${i}`);
        const tabEl = document.getElementById(`step-tab-${i}`);
        if (stepEl) {
            if (i === step) {
                stepEl.classList.remove('hidden');
                stepEl.classList.remove('step-slide-in');
                void stepEl.offsetWidth;
                stepEl.classList.add('step-slide-in');
            } else {
                stepEl.classList.add('hidden');
                stepEl.classList.remove('step-slide-in');
            }
        }
        if (tabEl) {
            if (i === step) {
                tabEl.className = 'text-neutral-900 border-b-2 border-neutral-900 pb-2 font-bold cursor-pointer transition-colors';
            } else if (i < step) {
                tabEl.className = 'text-[#c5a059] border-b-2 border-[#c5a059] pb-2 font-medium cursor-pointer transition-colors';
            } else {
                tabEl.className = 'text-neutral-400 pb-2 cursor-pointer font-normal transition-colors';
            }
        }
    }

    if (step === 2) {
        renderCalendar();
        renderTimeSlots();
    }

    // Płynne przewinięcie do widżetu rezerwacji, jeśli jest poza optymalnym polem widzenia
    const rezerwacjaEl = document.getElementById('rezerwacja');
    if (rezerwacjaEl && step > 1) {
        const rect = rezerwacjaEl.getBoundingClientRect();
        if (rect.top < -50 || rect.top > 250) {
            rezerwacjaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

/* === OBSŁUGA DOSTĘPNOŚCI TERMINÓW & KALENDARZ === */
function getBookedSlotsForDate(dateStr) {
    ensureInitialDemoData();
    const active = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY) || '[]');
    const history = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_HISTORY_KEY) || '[]');
    const booked = [];

    active.forEach(b => {
        if (b.booking_date === dateStr && b.status !== 'Usunięta' && b.booking_time) {
            booked.push(b.booking_time);
        }
    });

    history.forEach(b => {
        if (b.booking_date === dateStr && b.status === 'Zatwierdzona' && b.booking_time) {
            booked.push(b.booking_time);
        }
    });

    return booked;
}

function getDayAvailability(dateStr) {
    const booked = getBookedSlotsForDate(dateStr);
    const slots = getTimeSlotsForDate(dateStr);
    if (booked.length >= slots.length) return 'full';      // Czerwony
    if (booked.length > 0) return 'partial';              // Żółty
    return 'free';                                        // Zielony
}

function changeMonth(delta) {
    if (delta < 0 && !canScrollPrev()) return;
    if (delta > 0 && !canScrollNext()) return;

    calendarMonth += delta;
    if (calendarMonth < 0) {
        calendarMonth = 11;
        calendarYear--;
    } else if (calendarMonth > 11) {
        calendarMonth = 0;
        calendarYear++;
    }
    renderCalendar();
}

function renderCalendar() {
    const monthYearEl = document.getElementById('current-month-year');
    const gridEl = document.getElementById('calendar-days-grid');
    if (!monthYearEl || !gridEl) return;

    monthYearEl.innerText = `${monthNames[calendarMonth]} ${calendarYear}`;
    gridEl.innerHTML = '';

    const prevBtn = document.getElementById('cal-prev-btn');
    const nextBtn = document.getElementById('cal-next-btn');

    if (prevBtn) {
        if (!canScrollPrev()) {
            prevBtn.disabled = true;
            prevBtn.classList.add('opacity-30', 'cursor-not-allowed');
        } else {
            prevBtn.disabled = false;
            prevBtn.classList.remove('opacity-30', 'cursor-not-allowed');
        }
    }

    if (nextBtn) {
        if (!canScrollNext()) {
            nextBtn.disabled = true;
            nextBtn.classList.add('opacity-30', 'cursor-not-allowed');
        } else {
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-30', 'cursor-not-allowed');
        }
    }

    const firstDayIndex = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const todayStr = `${currentRealYear}-${String(currentRealMonth + 1).padStart(2, '0')}-${String(currentRealDay).padStart(2, '0')}`;
    const maxBookingDate = getMaxBookingLimitDate();
    const maxBookingStr = `${maxBookingDate.getFullYear()}-${String(maxBookingDate.getMonth() + 1).padStart(2, '0')}-${String(maxBookingDate.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'h-11 sm:h-14';
        gridEl.appendChild(empty);
    }

    for (let d = 1; d <= totalDays; d++) {
        const dayStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDate = new Date(calendarYear, calendarMonth, d);
        const dayOfWeek = dayDate.getDay(); // 0=Nd, 6=Sb

        const isPast = (dayStr < todayStr);
        const isBeyond6Months = (dayStr > maxBookingStr);
        const isSunday = (dayOfWeek === 0); // Niedziela zamknięte
        const isBlocked = isPast || isBeyond6Months || isSunday;

        const isSelected = (bookingState.selectedDate === dayStr);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerText = d;

        if (isBlocked) {
            btn.className = 'h-11 sm:h-14 rounded-xl text-neutral-300 text-sm font-medium flex items-center justify-center cursor-not-allowed opacity-35 select-none';
            btn.disabled = true;
        } else {
            const avail = getDayAvailability(dayStr);
            let cls = 'calendar-day-btn h-11 sm:h-14 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center transition cursor-pointer border ';

            if (isSelected) {
                cls += 'selected-day';
            } else if (avail === 'full') {
                cls += 'cal-day-full';
            } else if (avail === 'partial') {
                cls += 'cal-day-partial';
            } else {
                cls += 'cal-day-free';
            }

            btn.className = cls;
            btn.onclick = () => selectBookingDate(dayStr);
        }

        gridEl.appendChild(btn);
    }
}

function selectBookingDate(dateStr) {
    bookingState.selectedDate = dateStr;
    const selectedDayEl = document.getElementById('selected-day-display');
    if (selectedDayEl) {
        const parts = dateStr.split('-');
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        selectedDayEl.innerText = `${dayNames[d.getDay()]}, ${parts[2]} ${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}`;
    }

    renderCalendar();
    renderTimeSlots();
}

function renderTimeSlots() {
    const container = document.getElementById('time-slots-container');
    if (!container) return;
    container.innerHTML = '';

    if (!bookingState.selectedDate) {
        container.innerHTML = '<div class="col-span-2 text-center text-sm text-neutral-400 py-6 font-medium">Wybierz najpierw dzień w kalendarzu.</div>';
        return;
    }

    const bookedSlots = getBookedSlotsForDate(bookingState.selectedDate);
    const slots = getTimeSlotsForDate(bookingState.selectedDate);

    slots.forEach(time => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isBooked = bookedSlots.includes(time);
        const isSelected = (bookingState.selectedTime === time);

        if (isBooked) {
            btn.className = 'p-4 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-400 text-sm sm:text-base font-bold cursor-not-allowed opacity-50 flex items-center justify-between line-through';
            btn.disabled = true;
            btn.innerHTML = `
                <span>${time}</span>
                <span class="text-xs uppercase font-bold text-neutral-400 no-underline">(Zajęty)</span>
            `;
        } else {
            let cls = 'p-4 rounded-xl border text-sm sm:text-base font-bold transition cursor-pointer flex items-center justify-between shadow-xs ';
            if (isSelected) {
                cls += 'bg-neutral-900 border-[#c5a059] text-white shadow-md ring-2 ring-[#c5a059]/40';
            } else {
                cls += 'bg-white border-neutral-200 text-neutral-900 hover:border-[#c5a059] hover:bg-neutral-50';
            }
            btn.className = cls;
            btn.innerHTML = `
                <span>${time}</span>
                <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Wolny</span>
            `;
            btn.onclick = () => selectBookingTime(time);
        }

        container.appendChild(btn);
    });
}

function selectBookingTime(time) {
    bookingState.selectedTime = time;
    renderTimeSlots();
}

/* === OBSŁUGA PLIKÓW INSPIRACJI === */
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addInspirationFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-[#c5a059]', 'bg-amber-50/30');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-[#c5a059]', 'bg-amber-50/30');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-[#c5a059]', 'bg-amber-50/30');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addInspirationFiles(Array.from(e.dataTransfer.files));
    }
}

function addInspirationFiles(files) {
    const maxFiles = 3;
    const remaining = maxFiles - uploadedInspirationFiles.length;
    if (remaining <= 0) {
        showCustomAlert('Limit Plików', 'Możesz dodać maksymalnie 3 zdjęcia inspiracji.', 'info');
        return;
    }

    const toAdd = files.slice(0, remaining);
    toAdd.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedInspirationFiles.push({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                dataUrl: event.target.result
            });
            renderUploadedFiles();
        };
        reader.readAsDataURL(file);
    });
}

function renderUploadedFiles() {
    const container = document.getElementById('uploaded-files-preview');
    if (!container) return;
    container.innerHTML = '';

    uploadedInspirationFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2.5 rounded-xl bg-white border border-neutral-200 text-xs shadow-sm';
        item.innerHTML = `
            <div class="flex items-center gap-2.5 overflow-hidden">
                <img src="${file.dataUrl}" alt="Preview" class="w-9 h-9 object-cover rounded-lg border border-neutral-200">
                <div class="truncate">
                    <span class="font-medium text-neutral-800 block truncate">${file.name}</span>
                    <span class="text-neutral-400 text-[10px]">${file.size}</span>
                </div>
            </div>
            <button type="button" onclick="removeInspirationFile(${index})" class="text-neutral-400 hover:text-rose-600 p-1 transition">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

function removeInspirationFile(index) {
    uploadedInspirationFiles.splice(index, 1);
    renderUploadedFiles();
}

/* === ZAPIS I WYSYŁKA FORMULARZA === */
function handleBookingSubmit(e) {
    e.preventDefault();

    const rodoConsent = document.getElementById('rodo-consent-checkbox')?.checked;
    if (!rodoConsent) {
        showCustomAlert('Zgoda RODO', 'Prosimy o zaznaczenie zgody na kontakt w sprawie rezerwacji.', 'error');
        return;
    }

    const name = (document.getElementById('booking-client-name')?.value || '').trim();
    const phone = (document.getElementById('booking-client-phone')?.value || '').trim();
    const email = (document.getElementById('booking-client-email')?.value || '').trim();
    const placement = (document.getElementById('booking-tattoo-placement')?.value || '').trim();
    const description = (document.getElementById('booking-description')?.value || '').trim();

    const newBooking = {
        id: 'CK-' + Date.now().toString().slice(-6),
        created_at: new Date().toISOString(),
        service_name: bookingState.selectedServiceName,
        booking_date: bookingState.selectedDate,
        booking_time: bookingState.selectedTime,
        client_name: name,
        client_phone: `${selectedCountry.code} ${phone}`,
        client_email: email,
        placement: placement,
        description: description || 'Brak dodatkowego opisu',
        status: 'Oczekująca',
        files_count: uploadedInspirationFiles.length
    };

    saveBookingLocally(newBooking);

    showCustomModal({
        title: 'Rezerwacja Zapisana!',
        message: `
            <div class="space-y-3">
                <p class="text-sm text-neutral-600 leading-relaxed font-normal">
                    Dziękujemy, <strong>${name}</strong>! Twoje zgłoszenie do <strong>Czarna Kropla Tattoo & Piercing</strong> zostało pomyślnie zarejestrowane.
                </p>
                <div class="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 space-y-1">
                    <div><strong>Termin:</strong> ${bookingState.selectedDate} o godz. ${bookingState.selectedTime}</div>
                    <div><strong>Usługa:</strong> ${bookingState.selectedServiceName}</div>
                    <div><strong>Miejsce:</strong> ${placement}</div>
                </div>
                <p class="text-xs text-neutral-500 font-normal">
                    Skontaktujemy się z Tobą telefonicznie lub mailowo w celu potwierdzenia szczegółów.
                </p>
            </div>
        `,
        type: 'success',
        confirmText: 'Wróć do Strony',
        onConfirm: () => {
            resetBookingForm();
            goToBookingStep(1);
        }
    });
}

function resetBookingForm() {
    bookingState = {
        step: 1,
        selectedServiceKey: 'fineline',
        selectedServiceName: 'Fine-line & Botanika',
        selectedDate: null,
        selectedTime: null
    };
    uploadedInspirationFiles = [];
    document.getElementById('booking-client-name').value = '';
    document.getElementById('booking-client-phone').value = '';
    document.getElementById('booking-client-email').value = '';
    document.getElementById('booking-tattoo-placement').value = '';
    document.getElementById('booking-description').value = '';
    const consent = document.getElementById('rodo-consent-checkbox');
    if (consent) consent.checked = false;
    renderUploadedFiles();
}

/* === LOCAL STORAGE I PANEL ADMINA === */
function ensureInitialDemoData() {
    if (!localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY)) {
        const demoDate = new Date();
        demoDate.setDate(demoDate.getDate() + 2);
        // Jeśli wypada w niedzielę, przesuń na poniedziałek
        if (demoDate.getDay() === 0) demoDate.setDate(demoDate.getDate() + 1);

        const dStr = `${demoDate.getFullYear()}-${String(demoDate.getMonth() + 1).padStart(2, '0')}-${String(demoDate.getDate()).padStart(2, '0')}`;

        const initial = [
            {
                id: 'CK-881201',
                created_at: new Date().toISOString(),
                service_name: 'Fine-line & Botanika',
                booking_date: dStr,
                booking_time: '11:30',
                client_name: 'Karolina Wójcik',
                client_phone: '+48 501 234 567',
                client_email: 'karolina@example.com',
                placement: 'Obojczyk / Ramię',
                description: 'Delikatna gałązka oliwna z kwiatami.',
                status: 'Oczekująca'
            },
            {
                id: 'CK-881202',
                created_at: new Date().toISOString(),
                service_name: 'Blackwork & Grafika',
                booking_date: dStr,
                booking_time: '13:30',
                client_name: 'Michał Kowal',
                client_phone: '+48 602 987 654',
                client_email: 'michal@example.com',
                placement: 'Przedramię',
                description: 'Błyskawice w mocnej czerni, styl graficzny.',
                status: 'Oczekująca'
            }
        ];
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(initial));
    }

    if (!localStorage.getItem(CONFIG.LOCAL_STORAGE_HISTORY_KEY)) {
        const historyDemo = [
            {
                id: 'CK-880910',
                decision_date: '2026-10-06 14:15',
                service_name: 'Piercing Profesjonalny',
                booking_date: '2026-10-06',
                booking_time: '14:00',
                client_name: 'Wiktoria K.',
                client_phone: '+48 790 112 334',
                status: 'Zatwierdzona'
            }
        ];
        localStorage.setItem(CONFIG.LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(historyDemo));
    }
}

function saveBookingLocally(booking) {
    ensureInitialDemoData();
    const list = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY) || '[]');
    list.unshift(booking);
    localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(list));
    renderAdminDashboard();
}

function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email')?.value.trim();
    const pass = document.getElementById('admin-password')?.value.trim();
    const errEl = document.getElementById('admin-login-error');

    if (email === CONFIG.DEMO_ADMIN_EMAIL && pass === CONFIG.DEMO_ADMIN_PASS) {
        if (errEl) errEl.classList.add('hidden');
        sessionStorage.setItem('admin_logged_in', 'true');
        document.getElementById('admin-login-box')?.classList.add('hidden');
        document.getElementById('admin-dashboard-content')?.classList.remove('hidden');
        renderAdminDashboard();
    } else {
        if (errEl) {
            errEl.innerText = 'Nieprawidłowy e-mail lub hasło demo.';
            errEl.classList.remove('hidden');
        }
    }
}

function renderAdminDashboard() {
    ensureInitialDemoData();
    const activeList = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY) || '[]');
    const historyList = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_HISTORY_KEY) || '[]');

    const activeTbody = document.getElementById('admin-active-bookings-body');
    const historyTbody = document.getElementById('admin-history-bookings-body');
    const activeCount = document.getElementById('admin-active-count');
    const historyCount = document.getElementById('admin-history-count');

    if (activeCount) activeCount.innerText = activeList.length;
    if (historyCount) historyCount.innerText = historyList.length;

    // Tabela 1: Oczekujące
    if (activeTbody) {
        activeTbody.innerHTML = '';
        if (activeList.length === 0) {
            activeTbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-sm text-neutral-400">Brak oczekujących rezerwacji. Wszystkie zostały przetworzone!</td></tr>';
        } else {
            activeList.forEach((b, idx) => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-neutral-50 transition border-b border-neutral-100 text-xs sm:text-sm text-neutral-700';
                tr.innerHTML = `
                    <td class="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        ${b.booking_date} <span class="text-[#c5a059] block sm:inline font-semibold">${b.booking_time || ''}</span>
                    </td>
                    <td class="py-3.5 px-4 font-semibold text-neutral-900">${b.client_name}</td>
                    <td class="py-3.5 px-4 font-mono text-neutral-500 text-xs">${b.client_phone}<br><span class="text-neutral-400">${b.client_email}</span></td>
                    <td class="py-3.5 px-4">${b.service_name}<br><span class="text-neutral-400 text-xs">${b.placement || ''}</span></td>
                    <td class="py-3.5 px-4">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            ${b.status}
                        </span>
                    </td>
                    <td class="py-3.5 px-4 text-right whitespace-nowrap">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="approveBooking(${idx})" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition shadow-sm" title="Zatwierdź">
                                <i class="fa-solid fa-check"></i> <span class="hidden sm:inline">Zatwierdź</span>
                            </button>
                            <button onclick="deleteBooking(${idx})" class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs uppercase tracking-wider transition" title="Usuń">
                                <i class="fa-solid fa-trash-can"></i> <span class="hidden sm:inline">Usuń</span>
                            </button>
                        </div>
                    </td>
                `;
                activeTbody.appendChild(tr);
            });
        }
    }

    // Tabela 2: Historia
    if (historyTbody) {
        historyTbody.innerHTML = '';
        if (historyList.length === 0) {
            historyTbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-sm text-neutral-400">Brak historii rezerwacji.</td></tr>';
        } else {
            historyList.forEach(b => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-neutral-50 transition border-b border-neutral-100 text-xs sm:text-sm text-neutral-600';
                const statusBadge = b.status === 'Zatwierdzona' 
                    ? '<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Zatwierdzona</span>'
                    : '<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">Usunięta</span>';

                tr.innerHTML = `
                    <td class="py-3 px-4 font-mono font-medium">${b.booking_date} ${b.booking_time || ''}</td>
                    <td class="py-3 px-4 font-semibold text-neutral-800">${b.client_name}</td>
                    <td class="py-3 px-4 font-mono text-neutral-400 text-xs">${b.client_phone}</td>
                    <td class="py-3 px-4">${b.service_name}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 text-right font-mono text-neutral-400 text-xs">${b.decision_date || '-'}</td>
                `;
                historyTbody.appendChild(tr);
            });
        }
    }
}

function approveBooking(index) {
    const activeList = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY) || '[]');
    const historyList = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_HISTORY_KEY) || '[]');

    const booking = activeList[index];
    if (!booking) return;

    showCustomModal({
        title: 'Zatwierdź Rezerwację',
        message: `Czy na pewno chcesz zatwierdzić rezerwację dla klienta <strong>${booking.client_name}</strong> na termin <strong>${booking.booking_date} o godz. ${booking.booking_time}</strong>?`,
        type: 'info',
        confirmText: 'Zatwierdź',
        cancelText: 'Anuluj',
        onConfirm: () => {
            booking.status = 'Zatwierdzona';
            booking.decision_date = new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });

            activeList.splice(index, 1);
            historyList.unshift(booking);

            localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(activeList));
            localStorage.setItem(CONFIG.LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(historyList));

            renderAdminDashboard();
            renderCalendar();
            renderTimeSlots();
        }
    });
}

function deleteBooking(index) {
    const activeList = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY) || '[]');
    const historyList = JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_HISTORY_KEY) || '[]');

    const booking = activeList[index];
    if (!booking) return;

    showCustomModal({
        title: 'Usuń Rezerwację',
        message: `Czy na pewno chcesz usunąć rezerwację klienta <strong>${booking.client_name}</strong>? Zostanie ona przeniesiona do historii ze statusem "Usunięta", a termin w kalendarzu znów stanie się wolny.`,
        type: 'error',
        confirmText: 'Usuń Rezerwację',
        cancelText: 'Anuluj',
        onConfirm: () => {
            booking.status = 'Usunięta';
            booking.decision_date = new Date().toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });

            activeList.splice(index, 1);
            historyList.unshift(booking);

            localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(activeList));
            localStorage.setItem(CONFIG.LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(historyList));

            renderAdminDashboard();
            renderCalendar();
            renderTimeSlots();
        }
    });
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_logged_in');
    document.getElementById('admin-dashboard-content')?.classList.add('hidden');
    document.getElementById('admin-login-box')?.classList.remove('hidden');
}

/* === WIDOK PANELU ADMINA Z HASHA #admin === */
function checkAdminRoute() {
    const isAdmin = window.location.hash === '#admin';
    const mainView = document.getElementById('main-content-view');
    const adminView = document.getElementById('admin-view-container');

    if (isAdmin) {
        if (mainView) mainView.classList.add('hidden');
        if (adminView) {
            adminView.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Jeśli admin jest zalogowany w bieżącej sesji, od razu otwórz dashboard
            if (sessionStorage.getItem('admin_logged_in') === 'true') {
                document.getElementById('admin-login-box')?.classList.add('hidden');
                document.getElementById('admin-dashboard-content')?.classList.remove('hidden');
            }
            // Zawsze odświeżaj dane przy każdym wejściu do panelu!
            renderAdminDashboard();
        }
    } else {
        if (mainView) mainView.classList.remove('hidden');
        if (adminView) adminView.classList.add('hidden');
    }
}

function navigateToAdmin() {
    window.location.hash = '#admin';
    checkAdminRoute();
    renderAdminDashboard();
}

window.addEventListener('hashchange', checkAdminRoute);

/* === LIGHTBOX DLA GALERII === */
const portfolioItems = [
    { src: 'portfolio-1.jpg', title: 'Ignorant & Neo-traditional Flash', tag: 'Hand Tattoo • Crying Heart' },
    { src: 'portfolio-2.png', title: 'Graphic Dark Art & Eye', tag: 'Knee Tattoo • Blackwork' },
    { src: 'portfolio-3.png', title: 'Dynamic Lightning Linework', tag: 'Upper Arm • Dark Electric' },
    { src: 'portfolio-4.png', title: 'Delicate Floral Fine-line', tag: 'Collarbone • Minimal Flora' }
];

let currentLightboxIndex = 0;

function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxContent();
    const lb = document.getElementById('portfolio-lightbox');
    if (lb) lb.classList.remove('hidden');
}

function closeLightbox() {
    const lb = document.getElementById('portfolio-lightbox');
    if (lb) lb.classList.add('hidden');
}

function updateLightboxContent() {
    const item = portfolioItems[currentLightboxIndex];
    if (!item) return;
    const imgEl = document.getElementById('lightbox-img');
    const titleEl = document.getElementById('lightbox-title');
    const counterEl = document.getElementById('lightbox-counter');
    const tagEl = document.getElementById('lightbox-subtitle');

    if (imgEl) imgEl.src = item.src;
    if (titleEl) titleEl.innerText = item.title;
    if (tagEl) tagEl.innerText = item.tag;
    if (counterEl) counterEl.innerText = `${currentLightboxIndex + 1} / ${portfolioItems.length}`;
}

function nextLightboxImage(e) {
    if (e) e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex + 1) % portfolioItems.length;
    updateLightboxContent();
}

function prevLightboxImage(e) {
    if (e) e.stopPropagation();
    currentLightboxIndex = (currentLightboxIndex - 1 + portfolioItems.length) % portfolioItems.length;
    updateLightboxContent();
}

function handleLightboxBackdropClick(e) {
    if (e.target.id === 'portfolio-lightbox' || e.target.id === 'lightbox-image-container') {
        closeLightbox();
    }
}

/* === COOKIES & PRIVACY MODAL === */
function acceptCookies() {
    localStorage.setItem('ck_cookies_accepted', 'true');
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        banner.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => banner.classList.add('hidden'), 500);
    }
}

function checkCookieConsent() {
    if (!localStorage.getItem('ck_cookies_accepted')) {
        setTimeout(() => {
            const banner = document.getElementById('cookie-banner');
            if (banner) {
                banner.classList.remove('hidden');
                setTimeout(() => banner.classList.remove('translate-y-full', 'opacity-0'), 100);
            }
        }, 1200);
    }
}

function openPrivacyModal() {
    const m = document.getElementById('privacy-modal');
    if (m) m.classList.remove('hidden');
}

function closePrivacyModal() {
    const m = document.getElementById('privacy-modal');
    if (m) m.classList.add('hidden');
}

/* === AMBIENT CANVAS W TLE (Subtelne złoto-szampańskie orby) === */
function initAmbientOrbs() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0;
    const orbs = [
        { x: 0.18, y: 0.22, vx: 0.00008, vy: 0.00007, radius: 400, color: 'rgba(197, 160, 89, 0.08)' },
        { x: 0.82, y: 0.45, vx: -0.00007, vy: 0.00008, radius: 460, color: 'rgba(224, 197, 142, 0.09)' },
        { x: 0.45, y: 0.78, vx: 0.00006, vy: -0.00007, radius: 420, color: 'rgba(180, 142, 68, 0.07)' },
        { x: 0.12, y: 0.88, vx: -0.00005, vy: -0.00006, radius: 340, color: 'rgba(212, 175, 55, 0.06)' }
    ];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function animate() {
        ctx.clearRect(0, 0, width, height);
        orbs.forEach(orb => {
            orb.x += orb.vx;
            orb.y += orb.vy;
            if (orb.x < 0.04 || orb.x > 0.96) orb.vx *= -1;
            if (orb.y < 0.04 || orb.y > 0.96) orb.vy *= -1;

            const px = orb.x * width, py = orb.y * height;
            const grad = ctx.createRadialGradient(px, py, 0, px, py, orb.radius);
            grad.addColorStop(0, orb.color);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, orb.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

/* === SCROLL REVEAL (Płynne pojawianie się elementów przy przewijaniu) === */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-on-scroll, .reveal-scale').forEach(el => observer.observe(el));
}

/* === PŁYNNE FAQ ACCORDION === */
function initFaqAccordion() {
    const allDetails = document.querySelectorAll('details.luxury-card');
    allDetails.forEach((targetDetail) => {
        targetDetail.addEventListener('click', (e) => {
            if (e.target.closest('summary')) {
                allDetails.forEach((otherDetail) => {
                    if (otherDetail !== targetDetail && otherDetail.open) {
                        otherDetail.open = false;
                    }
                });
            }
        });
    });
}

/* === INICJALIZACJA PRZY STARCIE === */
document.addEventListener('DOMContentLoaded', () => {
    ensureInitialDemoData();
    initAmbientOrbs();
    initScrollReveal();
    initFaqAccordion();
    renderCalendar();
    checkAdminRoute();
    checkCookieConsent();

    // Rejestracja zdarzeń formularza
    const bookingForm = document.getElementById('main-booking-form');
    if (bookingForm) bookingForm.addEventListener('submit', handleBookingSubmit);

    const adminForm = document.getElementById('admin-login-form');
    if (adminForm) adminForm.addEventListener('submit', handleAdminLogin);

    // Klawisze klawiatury dla modali i lightboxa
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            closePrivacyModal();
        }
        if (e.key === 'ArrowRight') nextLightboxImage();
        if (e.key === 'ArrowLeft') prevLightboxImage();
    });

    // Płynne zamykanie dropdowna krajów przy kliknięciu poza
    document.addEventListener('click', (e) => {
        const dd = document.getElementById('country-dropdown-menu');
        const trigger = document.getElementById('country-select-trigger');
        if (dd && !dd.classList.contains('hidden')) {
            if (trigger && !trigger.contains(e.target) && !dd.contains(e.target)) {
                toggleCountryDropdown(false);
            }
        }
    });
});
