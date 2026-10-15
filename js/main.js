const projects = [
    {
        id: "livox",
        name: "LIVOX",
        icon: "LX",
        status: "In progress",
        description:
            "A Flask and MySQL web application focused on turning a practical idea into a polished, database-backed product.",
        tags: ["Python", "Flask", "MySQL", "Web App"],
        progress: 45,
        next:
            "Next: complete the main user flow, validate form inputs, document database setup, and add screenshots.",
        repo: "https://github.com/sonu919943-cell/LIVOX "
    },
    {
        id: "image-processing-tool",
        name: "Image Processing Tool",
        icon: "IP",
        status: "Learning build",
        description:
            "A Python project for experimenting with image operations, NumPy workflows, and clear before-and-after outputs.",
        tags: ["Python", "NumPy", "Image Processing"],
        progress: 75,
        next:
            "Next: include sample images, list supported operations, handle edge cases, and add a short demo.",
        repo: "https://github.com/pPiyushK/ImageProcessingTool"
    },
    {
        id: "student-management-system",
        name: "student management system",
        icon: "SMS",
        status: "Learning build",
        description:
            "A Python project for experimenting with A CRUD web application built using Flask and SQLite.",
        tags: ["Python", "Flask", "SQLite"],
        progress: 85,
        next:
            "Next: include sample images, list supported operations, handle edge cases, and add a short demo.",
        repo: "https://github.com/pPiyushK/ImageProcessingTool"
    }


];

const $ = selector => document.querySelector(selector);
const grid = $("#projectGrid");

const escapeHTML = value =>
    String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

function renderProjects() {
    grid.innerHTML = projects.map((project, index) => `
        <article class="project">
            <div class="project-top">
                <div class="project-icon">${escapeHTML(project.icon)}</div>
                <span class="status">${escapeHTML(project.status)}</span>
            </div>

            <h3>${escapeHTML(project.name)}</h3>
            <p>${escapeHTML(project.description)}</p>

            <div class="tags">
                ${project.tags.map(tag =>
                    `<span class="tag">${escapeHTML(tag)}</span>`
                ).join("")}
            </div>

            <div class="progress-head">
                <span>Progress</span>
                <strong>${project.progress}%</strong>
            </div>

            <div class="progress">
                <span style="width:${project.progress}%"></span>
            </div>

            <div class="project-foot">
                <button class="text-link" type="button" data-project="${index}">
                    View project details
                </button>
                <small>Project ${String(index + 1).padStart(2, "0")}</small>
            </div>
        </article>
    `).join("");

    $("#projectCount").textContent = projects.length;
}

function openModal(id) {
    $("#" + id)?.classList.add("open");
}

function closeModal(id) {
    $("#" + id)?.classList.remove("open");
}

grid.addEventListener("click", event => {
    const button = event.target.closest("[data-project]");

    if (!button) return;

    const project = projects[Number(button.dataset.project)];

    if (!project) return;

    $("#detailTitle").textContent = project.name;
    $("#detailDescription").textContent = project.description;

    $("#detailTags").innerHTML = project.tags
        .map(tag => `<span class="tag">${escapeHTML(tag)}</span>`)
        .join("");

    $("#detailProgress").textContent = project.progress + "%";
    $("#detailBar").style.width = project.progress + "%";
    $("#detailNext").textContent = project.next;
    $("#detailGithub").href = project.repo;

    openModal("detailModal");
});

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal(button.dataset.close);
    });
});

document.querySelectorAll(".modal-backdrop").forEach(modal => {
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.querySelectorAll(".modal-backdrop.open").forEach(modal => {
            closeModal(modal.id);
        });
    }
});

$("#year").textContent = new Date().getFullYear();

renderProjects();

// Share project data with the 3D village and notify it whenever the list is rendered.
window.portfolioProjects = projects;
window.dispatchEvent(new CustomEvent("portfolio:projects-updated", {
    detail: { projects }
}));
