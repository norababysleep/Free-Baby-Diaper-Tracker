        // Notification system
        function showNotification(message, isError = false) {
            const notif = document.getElementById('notification');
            notif.textContent = message;
            notif.style.backgroundColor = isError ? '#e76f51' : '#a7c957';
            notif.classList.add('show');
            setTimeout(() => notif.classList.remove('show'), 3000);
        }

        // Set default time to midnight
        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        document.getElementById('filterDate').value = todayMidnight.toISOString().split('T')[0];
        document.getElementById('timestamp').value = todayMidnight.toISOString().slice(0, 16);

        // Rest of JavaScript (same as before)
        const babyNameInput = document.getElementById('babyName');
        const notesTextarea = document.getElementById('notes');
        const timestampInput = document.getElementById('timestamp');
        const saveEntryBtn = document.getElementById('saveEntry');
        const wetCountEl = document.getElementById('wetCount');
        const dirtyCountEl = document.getElementById('dirtyCount');
        const totalCountEl = document.getElementById('totalCount');
        const lastChangeEl = document.getElementById('lastChange');
        const historyList = document.getElementById('historyList');
        const filterBabySelect = document.getElementById('filterBaby');
        const filterDateInput = document.getElementById('filterDate');
        const filterTypeSelect = document.getElementById('filterType');
        const applyFiltersBtn = document.getElementById('applyFilters');
        const exportCSVBtn = document.getElementById('exportCSV');
        const printViewBtn = document.getElementById('printView');
        const clearDataBtn = document.getElementById('clearData');

        let diaperEntries = JSON.parse(localStorage.getItem('diaperEntries')) || [];

        function updateCounters() {
            let wet = 0, dirty = 0, total = 0;
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

            diaperEntries.forEach(e => {
                const d = new Date(e.timestamp);
                if (d >= start && d <= end) {
                    total++;
                    if (e.type === 'wet' || e.type === 'both') wet++;
                    if (e.type === 'dirty' || e.type === 'both') dirty++;
                }
            });

            animateCounter(wetCountEl, wet);
            animateCounter(dirtyCountEl, dirty);
            animateCounter(totalCountEl, total);

            if (diaperEntries.length > 0) {
                lastChangeEl.textContent = `Last change: ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(diaperEntries[0].timestamp))}`;
            } else {
                lastChangeEl.textContent = 'Last change: Not recorded yet';
            }
        }

        function animateCounter(el, target) {
            const start = parseInt(el.textContent) || 0;
            if (start === target) return;
            const duration = 600;
            const range = target - start;
            let current = start;
            const increment = range / (duration / 16);
            const timer = setInterval(() => {
                current += increment;
                if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
                    el.textContent = target;
                    clearInterval(timer);
                } else {
                    el.textContent = Math.round(current);
                }
            }, 16);
        }

        function populateBabyFilter() {
            const names = [...new Set(diaperEntries.map(e => e.babyName))].sort();
            filterBabySelect.innerHTML = '<option value="all">All Babies</option>';
            names.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                filterBabySelect.appendChild(opt);
            });
        }

        function renderHistory() {
            let filtered = diaperEntries;
            const fb = filterBabySelect.value;
            const fd = filterDateInput.value;
            const ft = filterTypeSelect.value;

            if (fb !== 'all') filtered = filtered.filter(e => e.babyName === fb);
            if (fd) filtered = filtered.filter(e => e.timestamp.split('T')[0] === fd);
            if (ft !== 'all') filtered = filtered.filter(e => e.type === ft);

            historyList.innerHTML = filtered.length ? 
                filtered.map(e => {
                    const d = new Date(e.timestamp);
                    const typeClass = `type-${e.type}`;
                    const typeText = e.type === 'wet' ? 'Wet' : e.type === 'dirty' ? 'Dirty' : 'Wet + Dirty';
                    return `
                        <div class="history-item" data-id="${e.id}">
                            <div class="history-content">
                                <div><strong>${e.babyName}</strong></div>
                                <span class="history-type ${typeClass}">${typeText}</span>
                                <div class="history-time">${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)}</div>
                                ${e.notes ? `<div class="history-notes">${e.notes}</div>` : ''}
                            </div>
                            <div class="history-actions">
                                <button class="action-btn action-edit" data-id="${e.id}">Edit</button>
                                <button class="action-btn action-delete" data-id="${e.id}">Delete</button>
                            </div>
                        </div>
                    `;
                }).join('') : '<p>No diaper changes match your filters.</p>';

            document.querySelectorAll('.action-edit').forEach(btn => 
                btn.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    const entry = diaperEntries.find(i => i.id === id);
                    if (!entry) return;
                    babyNameInput.value = entry.babyName;
                    notesTextarea.value = entry.notes;
                    timestampInput.value = new Date(entry.timestamp).toISOString().slice(0, 16);
                    document.querySelectorAll('.btn-group button').forEach(b => {
                        b.classList.remove('btn-primary', 'btn-wet', 'btn-dirty', 'btn-both');
                        b.classList.add(`btn-${b.dataset.type}`);
                    });
                    document.querySelector(`.btn-group button[data-type="${entry.type}"]`).classList.remove(`btn-${entry.type}`);
                    document.querySelector(`.btn-group button[data-type="${entry.type}"]`).classList.add('btn-primary');
                    diaperEntries = diaperEntries.filter(i => i.id !== id);
                    localStorage.setItem('diaperEntries', JSON.stringify(diaperEntries));
                    updateCounters(); renderHistory(); populateBabyFilter();
                })
            );

            document.querySelectorAll('.action-delete').forEach(btn => 
                btn.addEventListener('click', (e) => {
                    if (!confirm('Delete this entry?')) return;
                    const id = e.target.dataset.id;
                    diaperEntries = diaperEntries.filter(i => i.id !== id);
                    localStorage.setItem('diaperEntries', JSON.stringify(diaperEntries));
                    updateCounters(); renderHistory(); populateBabyFilter();
                    showNotification('Entry deleted.');
                })
            );
        }

        saveEntryBtn.addEventListener('click', () => {
            const active = document.querySelector('.btn-group .btn-primary');
            const name = babyNameInput.value.trim();
            if (!name) return showNotification('Please enter a baby name', true);
            if (!active) return showNotification('Please select a diaper type', true);
            
            const newEntry = {
                id: Date.now().toString(),
                babyName: name,
                type: active.dataset.type,
                notes: notesTextarea.value.trim(),
                timestamp: timestampInput.value ? new Date(timestampInput.value).toISOString() : new Date().toISOString()
            };
            
            diaperEntries.unshift(newEntry);
            localStorage.setItem('diaperEntries', JSON.stringify(diaperEntries));
            babyNameInput.value = '';
            notesTextarea.value = '';
            const now = new Date();
            timestampInput.value = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0).toISOString().slice(0, 16);
            updateCounters(); renderHistory(); populateBabyFilter();
            showNotification('Diaper change recorded!');
        });

        applyFiltersBtn.addEventListener('click', renderHistory);
        exportCSVBtn.addEventListener('click', () => {
            if (!diaperEntries.length) return showNotification('No data to export', true);
            let csv = 'Baby Name,Diaper Type,Timestamp,Notes\n';
            diaperEntries.forEach(e => {
                const type = e.type === 'wet' ? 'Wet' : e.type === 'dirty' ? 'Dirty' : 'Wet + Dirty';
                csv += `"${e.babyName}","${type}","${e.timestamp}","${e.notes.replace(/"/g, '""')}"\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'diaper_history.csv'; a.style.visibility = 'hidden';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            showNotification('Export started!');
        });
        printViewBtn.addEventListener('click', () => window.print());
        clearDataBtn.addEventListener('click', () => {
            if (!confirm('Delete all records? This cannot be undone.')) return;
            localStorage.removeItem('diaperEntries');
            diaperEntries = [];
            updateCounters(); renderHistory(); populateBabyFilter();
            showNotification('All data cleared.');
        });

        updateCounters(); renderHistory(); populateBabyFilter();
