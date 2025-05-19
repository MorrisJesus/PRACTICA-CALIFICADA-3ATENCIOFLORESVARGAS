class TeamGenerator {
    constructor() {
        this.participants = [];
        this.teams = [];
        this.leaders = [];
        this.initializeEventListeners();
        this.updateCharCounter();
        this.updateDivisionSelect();
    }

    initializeEventListeners() {
        document.getElementById("participants").addEventListener("input", () => {
            this.handleInput();
        });

        document.querySelectorAll('input[name="divisionType"]').forEach((radio) => {
            radio.addEventListener("change", () => {
                this.updateDivisionSelect();
            });
        });

        document.getElementById("clearBtn").addEventListener("click", () => {
            this.clearForm();
        });

        document.getElementById("generateBtn").addEventListener("click", () => {
            this.generateTeams();
        });

        document.getElementById("backBtn").addEventListener("click", () => {
            this.showSetupScreen();
        });

        document.getElementById("downloadBtn").addEventListener("click", () => {
            this.downloadAsJPG();
        });

        document.getElementById("copyAllBtn").addEventListener("click", () => {
            this.copyToClipboard();
        });

        document.getElementById("copyColumnsBtn").addEventListener("click", () => {
            this.copyAsColumns();
        });
    }

    handleInput() {
        const textarea = document.getElementById("participants");
        let lines = textarea.value.split("\n");

        // Eliminar líneas vacías al final para evitar contar líneas vacías
        while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
            lines.pop();
        }

        // Limitar a 100 líneas activas
        if (lines.length > 100) {
            lines = lines.slice(0, 100);
            textarea.value = lines.join("\n");
        }

        // Limitar 50 caracteres por línea
        let changed = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].length > 50) {
                lines[i] = lines[i].substring(0, 50);
                changed = true;
            }
        }
        if (changed) {
            textarea.value = lines.join("\n");
        }

        // Actualizar contador
        const lastLineLength = lines.length > 0 ? lines[lines.length - 1].length : 0;
        document.getElementById(
            "charCounter"
        ).textContent = `Participantes: ${lines.length} / 100 | Caracteres: ${lastLineLength} / 50`;
    }

    updateCharCounter() {
        // Para inicializar el contador en carga
        this.handleInput();
    }

    updateDivisionSelect() {
        const divisionType = document.querySelector(
            'input[name="divisionType"]:checked'
        ).value;
        const select = document.getElementById("divisionSelect");
        select.innerHTML = "";

        if (divisionType === "teamCount") {
            for (let i = 2; i <= 10; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent = i === 2 ? `${i} equipos ✓` : `${i} equipos`;
                select.appendChild(option);
            }
        } else {
            for (let i = 2; i <= 20; i++) {
                const option = document.createElement("option");
                option.value = i;
                option.textContent =
                    i === 2 ? `${i} participantes ✓` : `${i} participantes`;
                select.appendChild(option);
            }
        }
    }

    clearForm() {
        document.getElementById("participants").value = "";
        document.getElementById("eventTitle").value = "";
        document.getElementById("divisionSelect").selectedIndex = 0;
        document.querySelector(
            'input[name="divisionType"][value="teamCount"]'
        ).checked = true;
        this.updateDivisionSelect();
        this.updateCharCounter();
        this.hideError();
    }

    validateInput() {
        const textarea = document.getElementById("participants");
        const lines = textarea.value.trim().split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
            this.showError("Debes ingresar al menos 2 participantes.");
            return false;
        }

        if (lines.length > 100) {
            this.showError("El máximo es 100 participantes.");
            return false;
        }

        for (let line of lines) {
            if (line.trim().length > 50) {
                this.showError(
                    `La línea "${line.trim().substring(0, 30)}..." excede los 50 caracteres.`
                );
                return false;
            }
        }

        const divisionType = document.querySelector(
            'input[name="divisionType"]:checked'
        ).value;
        const divisionValue = parseInt(document.getElementById("divisionSelect").value);

        if (divisionType === "teamCount" && divisionValue > lines.length) {
            this.showError("No puedes crear más equipos que participantes.");
            return false;
        }

        if (divisionType === "memberCount" && divisionValue > lines.length) {
            this.showError(
                "No puedes tener más miembros por equipo que total de participantes."
            );
            return false;
        }

        return true;
    }

    showError(message) {
        const errorElement = document.getElementById("participantError");
        errorElement.textContent = message;
        errorElement.classList.remove("hidden");
    }

    hideError() {
        document.getElementById("participantError").classList.add("hidden");
    }

    async generateTeams() {
        if (!this.validateInput()) return;

        this.hideError();
        this.setLoadingState(true);

        await new Promise((resolve) => setTimeout(resolve, 1000)); // simular carga

        try {
            this.processParticipants();
            this.createTeams();
            this.showResultsScreen();
            this.animateResults();
        } catch (e) {
            this.showError("Error al generar equipos. Inténtalo de nuevo.");
            console.error(e);
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const btn = document.getElementById("generateBtn");
        const text = document.getElementById("generateText");
        const spinner = document.getElementById("generateLoading");

        btn.disabled = loading;
        text.classList.toggle("hidden", loading);
        spinner.classList.toggle("hidden", !loading);
    }

    processParticipants() {
        const textarea = document.getElementById("participants");
        const lines = textarea.value.trim().split("\n").filter((line) => line.trim());

        this.participants = [];
        this.leaders = [];

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("*")) {
                const leader = trimmed.substring(1).trim();
                this.leaders.push(leader);
                this.participants.push(leader);
            } else {
                this.participants.push(trimmed);
            }
        });

        this.shuffleArray(this.participants);
    }

    createTeams() {
        const divisionType = document.querySelector('input[name="divisionType"]:checked').value;
        const divisionValue = parseInt(document.getElementById("divisionSelect").value);

        this.teams = [];
        let teamCount, membersPerTeam;

        if (divisionType === "teamCount") {
            teamCount = divisionValue;
            membersPerTeam = Math.ceil(this.participants.length / teamCount);
        } else {
            membersPerTeam = divisionValue;
            teamCount = Math.ceil(this.participants.length / membersPerTeam);
        }

        for (let i = 0; i < teamCount; i++) {
            this.teams.push([]);
        }

        this.leaders.forEach((leader, idx) => {
            if (idx < teamCount) {
                this.teams[idx].push(leader);
                const leaderIndex = this.participants.indexOf(leader);
                if (leaderIndex > -1) this.participants.splice(leaderIndex, 1);
            }
        });

        let teamIndex = 0;
        this.participants.forEach((participant) => {
            this.teams[teamIndex].push(participant);
            teamIndex = (teamIndex + 1) % teamCount;
        });
    }

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    showSetupScreen() {
        document.getElementById("setupScreen").style.display = "block";
        document.getElementById("resultsScreen").style.display = "none";
    }

    showResultsScreen() {
        document.getElementById("setupScreen").style.display = "none";
        document.getElementById("resultsScreen").style.display = "block";

        const title = document.getElementById("eventTitle").value || "Equipos Generados";
        document.getElementById("resultsTitle").textContent = title;

        this.renderTeams();
    }

    renderTeams() {
        const container = document.getElementById("teamsContainer");
        container.innerHTML = "";

        this.teams.forEach((team, idx) => {
            const card = document.createElement("div");
            card.className = "team-card";

            const title = document.createElement("h3");
            title.className = "team-title";
            title.textContent = `Equipo ${idx + 1}`;

            const list = document.createElement("ul");
            list.className = "team-members";

            team.forEach((member) => {
                const li = document.createElement("li");
                li.className = "team-member";
                li.textContent = this.leaders.includes(member)
                    ? `${member} (Líder)`
                    : member;
                list.appendChild(li);
            });

            card.appendChild(title);
            card.appendChild(list);
            container.appendChild(card);
        });
    }

    animateResults() {
        const members = document.querySelectorAll(".team-member");
        members.forEach((member, i) => {
            member.style.animationDelay = `${i * 0.1}s`;
            member.classList.add("show");
        });
    }

    async downloadAsJPG() {
        const container = document.getElementById("teamsContainer");
        try {
            const canvas = await html2canvas(container);
            const link = document.createElement("a");
            link.download = "equipos_generados.jpg";
            link.href = canvas.toDataURL("image/jpeg", 1.0);
            link.click();
        } catch (e) {
            alert("Error al generar la imagen. Intenta nuevamente.");
            console.error(e);
        }
    }

    async copyToClipboard() {
        try {
            const title = document.getElementById("resultsTitle").textContent;
            let text = `${title}\n${"=".repeat(title.length)}\n\n`;

            this.teams.forEach((team, idx) => {
                text += `Equipo ${idx + 1}:\n`;
                team.forEach((member) => {
                    const memText = this.leaders.includes(member)
                        ? `${member} (Líder)`
                        : member;
                    text += `• ${memText}\n`;
                });
                text += "\n";
            });

            await navigator.clipboard.writeText(text);
            this.showSuccessMessage("Equipos copiados al portapapeles");
        } catch (e) {
            this.showError("Error al copiar al portapapeles");
            console.error(e);
        }
    }

    async copyAsColumns() {
        try {
            let text = "";
            const maxLen = Math.max(...this.teams.map((t) => t.length));

            this.teams.forEach((team, idx) => {
                text += `Equipo ${idx + 1}\t`;
            });
            text += "\n";

            for (let i = 0; i < maxLen; i++) {
                this.teams.forEach((team) => {
                    if (i < team.length) {
                        const memText = this.leaders.includes(team[i])
                            ? `${team[i]} (Líder)`
                            : team[i];
                        text += memText + "\t";
                    } else {
                        text += "\t";
                    }
                });
                text += "\n";
            }

            await navigator.clipboard.writeText(text);
            this.showSuccessMessage(
                "Equipos copiados en columnas al portapapeles"
            );
        } catch (e) {
            this.showError("Error al copiar en columnas");
            console.error(e);
        }
    }

    showSuccessMessage(msg) {
        const el = document.getElementById("copySuccess");
        el.textContent = msg;
        el.classList.remove("hidden");
        setTimeout(() => {
            el.classList.add("hidden");
        }, 3000);
    }
}

const teamGenerator = new TeamGenerator();