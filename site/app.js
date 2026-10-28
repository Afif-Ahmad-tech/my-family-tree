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
        saveFailed = false;
    } catch (error) {
        console.error("Could not save family tree:", error);

        if (!saveFailed) {
            saveFailed = true;

            alert(
                "Your family tree could not be saved in this browser " +
                "(storage is full). Export a backup, then remove some " +
                "photos or people."
            );
        }
    }
}

let data = loadData();

let saveFailed = false;

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
        person => esc(
            [person.data["first name"], person.data["last name"]]
                .filter(Boolean)
                .join(" ")
        ),
        person => esc(person.data.birthday)
    ])
    .setCardImageField("image")
    .setStyle("imageCircleRect");

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
        "image"
    ])
    .setEditFirst(true);
    /* -------------------------------------------------------
   PHOTO UPLOAD FOR FAMILY MEMBERS
------------------------------------------------------- */

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = event => {
            const img = new Image();

            img.onload = () => {
                const MAX_SIZE = 800;

                let width = img.width;
                let height = img.height;

                if (width > height && width > MAX_SIZE) {
                    height = Math.round(
                        height * MAX_SIZE / width
                    );
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = Math.round(
                        width * MAX_SIZE / height
                    );
                    height = MAX_SIZE;
                }

                const canvas =
                    document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const ctx =
                    canvas.getContext("2d");

                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );

                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        0.8
                    )
                );
            };

            img.onerror = reject;
            img.src = event.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


function setPhotoButtonLabel(button, hasPhoto) {
    button.innerHTML =
        `<svg class="app-icon" aria-hidden="true"><use href="#i-camera"/></svg>` +
        `<span>${hasPhoto ? "Change photo" : "Choose photo"}</span>`;
}


function setupPhotoUpload() {
    const inputs =
        document.querySelectorAll("input");

    inputs.forEach(input => {

        if (
            input.dataset.photoEnhanced === "true"
        ) {
            return;
        }

        const name =
            (
                input.name ||
                input.getAttribute("name") ||
                ""
            ).toLowerCase();

        if (name !== "image") {
            return;
        }

        input.dataset.photoEnhanced = "true";

        /* Keep the original text field hidden */
        input.style.display = "none";

        const container =
            document.createElement("div");

        container.className =
            "photo-upload-container";

        const preview =
            document.createElement("img");

        preview.className =
            "photo-upload-preview";

        preview.alt =
            "Person photo";

        if (input.value) {
            preview.src = input.value;
            preview.style.display = "block";
        } else {
            preview.style.display = "none";
        }

        const button =
            document.createElement("button");

        button.type = "button";
        button.className =
            "photo-upload-button";

        setPhotoButtonLabel(button, Boolean(input.value));

        const fileInput =
            document.createElement("input");

        fileInput.type = "file";
        fileInput.accept =
            "image/jpeg,image/png,image/webp";

        fileInput.style.display = "none";

        button.addEventListener(
            "click",
            () => fileInput.click()
        );

        fileInput.addEventListener(
            "change",
            async () => {

                const file =
                    fileInput.files?.[0];

                if (!file) {
                    return;
                }

                if (!file.type.startsWith("image/")) {
                    alert(
                        "Please select an image file."
                    );
                    return;
                }

                try {

                    const imageData =
                        await compressImage(file);

                    /*
                     * Put the actual image data into
                     * Family Chart's original image
                     * field.
                     */
                    input.value = imageData;

                    input.dispatchEvent(
                        new Event(
                            "input",
                            {
                                bubbles: true
                            }
                        )
                    );

                    input.dispatchEvent(
                        new Event(
                            "change",
                            {
                                bubbles: true
                            }
                        )
                    );

                    preview.src = imageData;
                    preview.style.display =
                        "block";

                    setPhotoButtonLabel(button, true);

                } catch (error) {

                    console.error(
                        "Photo processing failed:",
                        error
                    );

                    alert(
                        "Could not process this photo."
                    );
                }
            }
        );

        container.appendChild(preview);
        container.appendChild(button);
        container.appendChild(fileInput);

        input.parentElement?.appendChild(
            container
        );
    });
}


/*
 * Family Chart creates its edit form dynamically,
 * so watch for the form appearing.
 */
const photoObserver =
    new MutationObserver(() => {
        setupPhotoUpload();
    });

photoObserver.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);

setupPhotoUpload();

/* -------------------------------------------------------
   VIEW / EDIT MODE
   View is the default: a card click opens a read-only
   profile. Edit hands the click to Family Chart's editor.
------------------------------------------------------- */

let mode = null;

card.setOnCardClick((event, datum) => {
    if (mode === "edit") {
        editTree.open(datum.data);
        card.onCardClickDefault(event, datum);
    } else {
        showPerson(datum.data.id);
    }
});

function setMode(next) {
    const previous = mode;

    mode = next === "edit" ? "edit" : "view";

    const editing = mode === "edit";

    document.body.classList.toggle("mode-edit", editing);

    const modeSwitch = document.getElementById("modeSwitch");
    const modeView = document.getElementById("modeView");
    const modeEdit = document.getElementById("modeEdit");

    modeSwitch?.setAttribute("data-mode", mode);

    modeView?.classList.toggle("is-active", !editing);
    modeEdit?.classList.toggle("is-active", editing);

    modeView?.setAttribute("aria-pressed", String(!editing));
    modeEdit?.setAttribute("aria-pressed", String(editing));

    const badge = document.getElementById("modeBadge");

    if (badge) {
        badge.textContent = editing ? "Editing" : "View only";
        badge.setAttribute("data-mode", mode);
    }

    const hint = document.getElementById("modeHint");

    if (hint) {
        hint.textContent = editing
            ? "Click a person to change their details."
            : "Click a person to see their details.";
    }

    const help = document.getElementById("modeHelp");

    if (help) {
        help.textContent = helpLabel(editing);
    }

    if (editing) {
        try {
            editTree.openFormWithId(chart.getMainDatum()?.id);
        } catch (error) {
            console.warn("Could not open the edit panel:", error);
        }

        refitAfterPanel();
    } else if (previous === "edit") {
        if (editTree.isAddingRelative?.()) {
            editTree.addRelativeInstance.onCancel?.();
        }

        if (editTree.isRemovingRelative?.()) {
            editTree.removeRelativeInstance.onCancel?.();
        }

        editTree.closeForm();

        refitAfterPanel();
    }
}

/*
 * The edit panel takes real width from the chart, so give
 * the width transition time to finish before refitting.
 */
function refitAfterPanel() {
    if (isMobileEditPanel()) {
        return;
    }

    setTimeout(() => {
        try {
            chart.updateTree(initialTreePosition());
        } catch (error) {
            console.warn("Could not refit the tree:", error);
        }
    }, 360);
}

function initialTreePosition() {
    if (window.innerWidth > 800) return { tree_position: "fit" };

    // Keep phone cards readable while fitting as much of the tree as possible.
    const fit = (window.innerWidth - 24) / chart.store.getTree().dim.width;

    return {
        tree_position: "main_to_middle",
        scale: Math.max(0.65, Math.min(1, fit))
    };
}

function helpLabel(editing) {
    if (window.innerWidth <= 800) {
        return editing ? "Tap a person to edit" : "Drag to pan · Tap a person";
    }

    return editing
        ? "Editing — click a person to open their details"
        : "Drag to pan · Scroll to zoom · Click a person";
}

document
    .getElementById("modeView")
    ?.addEventListener("click", () => {
        setMode("view");
        closeSidebar();
    });

document
    .getElementById("modeEdit")
    ?.addEventListener("click", () => {
        setMode("edit");
        closeSidebar();
    });

setMode("view");

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
    chart.updateTree({ initial: true });

    if (window.innerWidth <= 800) {
        chart.updateTree(initialTreePosition());
    }
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

function genderLabel(gender) {
    if (gender === "M") return "Male";
    if (gender === "F") return "Female";

    return gender || "—";
}

function esc(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char])
    );
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
                <h2>${esc(title)}</h2>

                <button
                    class="modal-close"
                    id="modalClose"
                    aria-label="Close"
                >
                    <svg class="app-icon" aria-hidden="true"><use href="#i-close" /></svg>
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
                    data-person-id="${esc(person.id)}"
                >
                    <div class="person-avatar ${
                        gender === "F"
                            ? "is-female"
                            : gender === "M"
                                ? "is-male"
                                : ""
                    }">
                        <svg class="app-icon" aria-hidden="true"><use href="#i-user" /></svg>
                    </div>

                    <div class="person-info">
                        <strong>${esc(name)}</strong>
                        <span>${esc(birthday)}</span>
                    </div>

                    <svg class="person-arrow app-icon app-icon--sm" aria-hidden="true"><use href="#i-chevron" /></svg>
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
                                ${esc(getFullName(
                                    relationship.person
                                ))}
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
                        ${esc(person.data?.birthday || "—")}
                    </strong>
                </div>

                <div class="detail-card">
                    <span>Gender</span>

                    <strong>
                        ${esc(genderLabel(person.data?.gender))}
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
            // Each link is stored on both people; keep one row per pair.
            if (
                String(person.id) >
                    String(relationship.person.id)
            ) {
                return;
            }

            rows.push(`
                <div class="relationship-card">

                    <div class="relationship-person">
                        <svg class="app-icon app-icon--sm" aria-hidden="true"><use href="#i-user" /></svg>

                        <strong>
                            ${esc(getFullName(person))}
                        </strong>
                    </div>

                    <div class="relationship-type">
                        ${relationship.type}
                    </div>

                    <div class="relationship-person">
                        <svg class="app-icon app-icon--sm" aria-hidden="true"><use href="#i-user" /></svg>

                        <strong>
                            ${esc(getFullName(
                                relationship.person
                            ))}
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
        chart.updateTree(initialTreePosition());
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
            importedData.length === 0 ||
            importedData.some(
                person =>
                    !person ||
                    typeof person !== "object" ||
                    person.id === undefined
            )
        ) {
            throw new Error(
                "Family tree data must be a non-empty array of people with ids."
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
    .getElementById("sidebarResetData")
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

const peopleCount = document.getElementById("peopleCount");

if (peopleCount) {
    peopleCount.textContent = String(data.length);
}

document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (document.getElementById("appModal")) return;

    if (mode === "edit") {
        editTree.closeForm();
        refitAfterPanel();
    }
});

document.addEventListener("click", event => {
    if (event.target.closest?.(".f3-close-btn")) {
        refitAfterPanel();
    }
});

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

        menuButton.setAttribute(
            "aria-expanded",
            String(sidebar?.classList.contains("sidebar-open"))
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
        const help = document.getElementById("modeHelp");

        if (help) {
            help.textContent = helpLabel(mode === "edit");
        }

        if (isMobileEditPanel()) return;

        try {
            chart.updateTree({
                ...initialTreePosition(),
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

function isMobileEditPanel() {
    return document.body.classList.contains("mode-edit") && window.innerWidth <= 800;
}

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