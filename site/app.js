const f3 = window.f3;

const STORAGE_KEY = "my-family-tree";

const defaultData = [
    {
        id: "1",
        data: {
            "first name": "John",
            "last name": "Doe",
            birthday: "1950",
            gender: "M"
        },
        rels: {
            spouses: ["2"],
            children: ["3", "4"]
        }
    },
    {
        id: "2",
        data: {
            "first name": "Jane",
            "last name": "Doe",
            birthday: "1952",
            gender: "F"
        },
        rels: {
            spouses: ["1"],
            children: ["3", "4"]
        }
    },
    {
        id: "3",
        data: {
            "first name": "Michael",
            "last name": "Doe",
            birthday: "1978",
            gender: "M"
        },
        rels: {
            parents: ["1", "2"],
            spouses: ["5"],
            children: ["6"]
        }
    },
    {
        id: "4",
        data: {
            "first name": "Sarah",
            "last name": "Doe",
            birthday: "1981",
            gender: "F"
        },
        rels: {
            parents: ["1", "2"]
        }
    },
    {
        id: "5",
        data: {
            "first name": "Emily",
            "last name": "Doe",
            birthday: "1980",
            gender: "F"
        },
        rels: {
            spouses: ["3"],
            children: ["6"]
        }
    },
    {
        id: "6",
        data: {
            "first name": "Alex",
            "last name": "Doe",
            birthday: "2010",
            gender: "M"
        },
        rels: {
            parents: ["3", "5"]
        }
    }
];

function cloneDefaultData() {
    return JSON.parse(JSON.stringify(defaultData));
}

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("Could not load family tree:", error);
    }

    return cloneDefaultData();
}

function saveData(dataToSave) {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(dataToSave)
        );
    } catch (error) {
        console.error("Could not save family tree:", error);
    }
}

let data = loadData();

if (!window.f3) {
    throw new Error(
        "Family Chart failed to load. Make sure d3.min.js and family-chart.min.js are loaded before app.js."
    );
}

/* -------------------------------------------------------
   FAMILY CHART
------------------------------------------------------- */

const chart = f3
    .createChart("#FamilyChart", data)
    .setTransitionTime(600);

const card = chart
    .setCardHtml()
    .setCardDisplay([
        ["first name", "last name"],
        ["birthday"]
    ])
    .setCardImageField("image");

/*
 * Family Chart's EditTree is responsible for the actual
 * add/edit/delete/relationship operations.
 *
 * The editor is connected to our card through
 * setCardClickOpen(card).
 */

const editTree = chart
    .editTree()
    .setFields([
        "first name",
        "last name",
        "birthday",
        "gender"
    ]);

if (typeof editTree.setCardClickOpen === "function") {
    editTree.setCardClickOpen(card);
}

/*
 * Keep our local copy synchronized when EditTree exposes
 * a change callback.
 */

if (typeof editTree.setOnChange === "function") {
    editTree.setOnChange(() => {
        try {
            if (typeof editTree.exportData === "function") {
                const exported = editTree.exportData();

                if (Array.isArray(exported)) {
                    data = exported;
                    saveData(data);
                }
            }
        } catch (error) {
            console.error(
                "Could not synchronize edited family data:",
                error
            );
        }
    });
}

requestAnimationFrame(() => {
    chart.updateTree({
        initial: true,
        tree_position: "fit"
    });
});

saveData(data);

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function getPerson(id) {
    return data.find(
        person => String(person.id) === String(id)
    );
}

function getFullName(person) {
    if (!person || !person.data) {
        return "Unknown";
    }

    return [
        person.data["first name"],
        person.data["last name"]
    ]
        .filter(Boolean)
        .join(" ");
}

function getRelationships(person) {
    if (!person || !person.rels) {
        return [];
    }

    const relationships = [];

    const addRelationship = (type, ids) => {
        if (!Array.isArray(ids)) return;

        ids.forEach(id => {
            const target = getPerson(id);

            if (target) {
                relationships.push({
                    type,
                    person: target
                });
            }
        });
    };

    addRelationship("Parent", person.rels.parents);
    addRelationship("Spouse", person.rels.spouses);
    addRelationship("Child", person.rels.children);

    return relationships;
}

/* -------------------------------------------------------
   MODAL
------------------------------------------------------- */

function openModal(title, content) {
    const existing = document.getElementById("appModal");

    if (existing) {
        existing.remove();
    }

    const modal = document.createElement("div");

    modal.id = "appModal";
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>${title}</h2>

                <button
                    class="modal-close"
                    id="modalClose"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document
        .getElementById("modalClose")
        ?.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener(
        "keydown",
        handleEscape,
        { once: true }
    );
}

function handleEscape(event) {
    if (event.key === "Escape") {
        closeModal();
    }
}

function closeModal() {
    const modal = document.getElementById("appModal");

    if (modal) {
        modal.remove();
    }
}

/* -------------------------------------------------------
   PEOPLE
------------------------------------------------------- */

function showPeople() {
    const peopleHtml = data
        .map(person => {
            const name = getFullName(person);

            const birthday =
                person.data?.birthday || "Unknown";

            const gender =
                person.data?.gender || "Unknown";

            return `
                <button
                    class="person-row"
                    data-person-id="${person.id}"
                >
                    <div class="person-avatar">
                        ${gender === "F" ? "👩" : "👨"}
                    </div>

                    <div class="person-info">
                        <strong>${name}</strong>
                        <span>${birthday}</span>
                    </div>

                    <span class="person-arrow">›</span>
                </button>
            `;
        })
        .join("");

    openModal(
        `People (${data.length})`,
        `
            <div class="people-list">
                ${peopleHtml}
            </div>
        `
    );

    document
        .querySelectorAll(".person-row")
        .forEach(button => {
            button.addEventListener("click", () => {
                const id =
                    button.dataset.personId;

                closeModal();

                showPerson(id);
            });
        });
}

/* -------------------------------------------------------
   PERSON DETAILS
------------------------------------------------------- */

function showPerson(id) {
    const person = getPerson(id);

    if (!person) {
        return;
    }

    const relationships =
        getRelationships(person);

    const relationshipHtml =
        relationships.length
            ? relationships
                .map(
                    relationship => `
                        <div class="relationship-row">
                            <span>${relationship.type}</span>

                            <strong>
                                ${getFullName(
                                    relationship.person
                                )}
                            </strong>
                        </div>
                    `
                )
                .join("")
            : `
                <div class="empty-state">
                    No relationships recorded.
                </div>
            `;

    openModal(
        getFullName(person),
        `
            <div class="person-details">

                <div class="detail-card">
                    <span>Birthday</span>

                    <strong>
                        ${person.data?.birthday || "—"}
                    </strong>
                </div>

                <div class="detail-card">
                    <span>Gender</span>

                    <strong>
                        ${person.data?.gender || "—"}
                    </strong>
                </div>

                <h3>Relationships</h3>

                <div class="relationships-list">
                    ${relationshipHtml}
                </div>

            </div>
        `
    );
}

/* -------------------------------------------------------
   RELATIONSHIPS
------------------------------------------------------- */

function showRelationships() {
    const rows = [];

    data.forEach(person => {
        const relationships =
            getRelationships(person);

        relationships.forEach(relationship => {
            if (
                relationship.type === "Spouse" &&
                String(person.id) >
                    String(relationship.person.id)
            ) {
                return;
            }

            rows.push(`
                <div class="relationship-card">

                    <div class="relationship-person">
                        <span>👤</span>

                        <strong>
                            ${getFullName(person)}
                        </strong>
                    </div>

                    <div class="relationship-type">
                        ${relationship.type}
                    </div>

                    <div class="relationship-person">
                        <span>👤</span>

                        <strong>
                            ${getFullName(
                                relationship.person
                            )}
                        </strong>
                    </div>

                </div>
            `);
        });
    });

    openModal(
        "Relationships",
        `
            <div class="relationships-list">
                ${
                    rows.length
                        ? rows.join("")
                        : `
                            <div class="empty-state">
                                No relationships found.
                            </div>
                        `
                }
            </div>
        `
    );
}

/* -------------------------------------------------------
   RESET
------------------------------------------------------- */

function resetFamily() {
    const confirmed = confirm(
        "Reset the family tree to the example data?"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);

    location.reload();
}

/* -------------------------------------------------------
   RESET VIEW
------------------------------------------------------- */

function resetView() {
    try {
        chart.updateTree({
            initial: true,
            tree_position: "fit"
        });
    } catch (error) {
        console.error(
            "Could not reset tree view:",
            error
        );

        location.reload();
    }
}

/* -------------------------------------------------------
   EXPORT
------------------------------------------------------- */

function exportFamily() {
    try {
        if (typeof editTree.exportData === "function") {
            const exported = editTree.exportData();

            if (Array.isArray(exported)) {
                data = exported;
            }
        }
    } catch (error) {
        console.warn(
            "Could not get current editor data. Exporting local data instead.",
            error
        );
    }

    saveData(data);

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        {
            type: "application/json"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        "family-tree.json";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

/* -------------------------------------------------------
   IMPORT
------------------------------------------------------- */

async function importFamily(event) {
    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    try {
        const text =
            await file.text();

        const importedData =
            JSON.parse(text);

        if (
            !Array.isArray(importedData) ||
            importedData.length === 0
        ) {
            throw new Error(
                "Family tree data must be a non-empty array."
            );
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(importedData)
        );

        location.reload();

    } catch (error) {
        console.error(error);

        alert(
            "Could not import the family tree.\n\n" +
            error.message
        );
    }

    event.target.value = "";
}

/* -------------------------------------------------------
   EVENT HANDLERS
------------------------------------------------------- */

document
    .getElementById("resetBtn")
    ?.addEventListener(
        "click",
        resetFamily
    );

document
    .getElementById("exportBtn")
    ?.addEventListener(
        "click",
        exportFamily
    );

document
    .getElementById("importBtn")
    ?.addEventListener(
        "click",
        () => {
            document
                .getElementById("importInput")
                ?.click();
        }
    );

document
    .getElementById("importInput")
    ?.addEventListener(
        "change",
        importFamily
    );

document
    .getElementById("sidebarReset")
    ?.addEventListener(
        "click",
        resetView
    );

document
    .getElementById("navFamily")
    ?.addEventListener(
        "click",
        () => {
            closeModal();
            resetView();
        }
    );

document
    .getElementById("navPeople")
    ?.addEventListener(
        "click",
        showPeople
    );

document
    .getElementById("navRelationships")
    ?.addEventListener(
        "click",
        showRelationships
    );

/* -------------------------------------------------------
   MOBILE SIDEBAR
------------------------------------------------------- */

const menuButton =
    document.getElementById("menuBtn");

const sidebar =
    document.querySelector(".sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

function closeSidebar() {
    sidebar?.classList.remove(
        "sidebar-open"
    );

    sidebarOverlay?.classList.remove(
        "overlay-visible"
    );
}

menuButton?.addEventListener(
    "click",
    () => {
        sidebar?.classList.toggle(
            "sidebar-open"
        );

        sidebarOverlay?.classList.toggle(
            "overlay-visible"
        );
    }
);

sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
);

document
    .querySelectorAll(".sidebar-item")
    .forEach(item => {
        item.addEventListener(
            "click",
            () => {
                if (
                    window.innerWidth <= 800
                ) {
                    closeSidebar();
                }
            }
        );
    });

let resizeTimer;

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
        try {
            chart.updateTree({
                tree_position: "fit",
                transition_time: 300
            });
        } catch (error) {
            console.warn(
                "Tree resize update failed:",
                error
            );
        }
    }, 200);
});

window.addEventListener(
    "resize",
    () => {
        if (
            window.innerWidth > 800
        ) {
            closeSidebar();
        }
    }
);