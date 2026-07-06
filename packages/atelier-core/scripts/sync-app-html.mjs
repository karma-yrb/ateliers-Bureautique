import fs from "node:fs/promises";
import path from "node:path";
import { APP_BOOTSTRAP_SCRIPT_ORDER } from "../runtime-contract.mjs";

const SHARED_SCRIPT_BLOCK = {
  start: "<!-- ATELIER_SHARED_BOOTSTRAP_SCRIPTS:START -->",
  end: "<!-- ATELIER_SHARED_BOOTSTRAP_SCRIPTS:END -->",
};

const SHARED_HEADER_NAV_BLOCK = {
  start: "<!-- ATELIER_SHARED_HEADER_NAV:START -->",
  end: "<!-- ATELIER_SHARED_HEADER_NAV:END -->",
};

const SHARED_OVERVIEW_PAGES_BLOCK = {
  start: "<!-- ATELIER_SHARED_OVERVIEW_PAGES:START -->",
  end: "<!-- ATELIER_SHARED_OVERVIEW_PAGES:END -->",
};

const SHARED_PROGRESS_PROFILE_BLOCK = {
  start: "<!-- ATELIER_SHARED_PROGRESS_PROFILE:START -->",
  end: "<!-- ATELIER_SHARED_PROGRESS_PROFILE:END -->",
};

const SHARED_USER_SETUP_BLOCK = {
  start: "<!-- ATELIER_SHARED_USER_SETUP_MODAL:START -->",
  end: "<!-- ATELIER_SHARED_USER_SETUP_MODAL:END -->",
};

const SHARED_EXERCISE_FEEDBACK_BLOCK = {
  start: "<!-- ATELIER_SHARED_EXERCISE_FEEDBACK_MODAL:START -->",
  end: "<!-- ATELIER_SHARED_EXERCISE_FEEDBACK_MODAL:END -->",
};

function renderScriptTags() {
  return APP_BOOTSTRAP_SCRIPT_ORDER
    .map((scriptPath) => `  <script defer src="${scriptPath}"></script>`)
    .join("\n");
}

function replaceMarkedBlock(source, block, content, indexPath) {
  const startIndex = source.indexOf(block.start);
  const endIndex = source.indexOf(block.end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`[sync-app-html] Marqueurs introuvables dans ${indexPath}: ${block.start}`);
  }

  const before = source.slice(0, startIndex + block.start.length);
  const after = source.slice(endIndex);
  return `${before}\n${content}\n  ${after}`;
}

function renderHeaderNav({ appName, version }) {
  return `  <header class="app-header">
    <div class="app-header-top">
      <div>
        <div class="title-row">
          <h1>Atelier ${appName}</h1>
          <span class="app-version" aria-label="Version de l'application">v${version}</span>
        </div>
        <p class="subtitle">Je choisis un thème, je lance un exercice, je suis les étapes.</p>
      </div>
      <div class="header-user-wrap">
        <button id="header-user-badge" class="header-user-badge header-user-badge-btn" type="button" aria-live="polite" aria-label="Ouvrir le menu utilisateur" aria-haspopup="true" aria-expanded="false" title="Menu utilisateur">
          <span class="header-user-label">Utilisateur ▾</span>
          <strong class="header-user-name">Non connecté</strong>
        </button>
        <div id="header-user-menu" class="header-user-menu" hidden role="menu">
          <button id="header-user-switch-btn" class="header-user-menu-item" type="button" role="menuitem">👤 Changer d'utilisateur</button>
          <button id="header-user-profile-btn" class="header-user-menu-item" type="button" role="menuitem">⚙ Profil &amp; options</button>
        </div>
      </div>
    </div>
  </header>

  <nav class="main-nav" aria-label="Navigation principale">
    <button class="nav-btn" data-nav="home">Accueil</button>
    <button class="nav-btn" data-nav="themes">Thèmes</button>
    <button class="nav-btn" data-nav="progress">Progression</button>
    <a class="nav-btn nav-link-btn" href="releases/">Releases</a>
  </nav>`;
}

function renderOverviewPages() {
  return `    <section id="page-home" class="page" aria-labelledby="home-title">
      <article class="card home-resume-card">
        <h2 id="home-title">Reprendre mon atelier</h2>
        <div class="home-resume-grid">
          <div class="home-resume-main">
            <div id="home-last-exercise" class="last-exercise"></div>
            <div class="home-progress-wrap">
              <h3 class="home-progress-title">Progression générale</h3>
              <p id="home-progress-text" class="muted">0 / 0 exercices terminés</p>
              <div class="progress-track" aria-hidden="true">
                <div id="home-progress-bar" class="progress-fill" style="width:0%"></div>
              </div>
              <p id="home-level" class="muted level-line"></p>
            </div>
          </div>
          <aside class="home-resume-action" aria-label="Action principale">
            <p class="home-action-label">Accès rapide</p>
            <button id="home-start-btn" class="btn btn-large home-start-btn has-icon" data-icon="▶">Commencer maintenant</button>
            <div class="home-quick-details" aria-live="polite">
              <p class="home-quick-line home-quick-theme-line">
                <span class="home-quick-kicker">Thème</span>
                <strong id="home-quick-theme">—</strong>
              </p>
              <p class="home-quick-line home-quick-exercise-line">
                <span class="home-quick-kicker">Exercice</span>
                <strong id="home-quick-exercise">—</strong>
              </p>
            </div>
            <p id="home-start-help" class="muted home-start-help">Lance automatiquement le prochain exercice conseillé.</p>
          </aside>
        </div>
      </article>
    </section>

    <section id="page-themes" class="page" aria-labelledby="themes-title">
      <article class="card themes-hero-card">
        <h2 id="themes-title">Explorer les thèmes</h2>
        <p class="muted">Choisissez une catégorie pour voir les séries d'exercices. Chaque catégorie regroupe des compétences proches.</p>
        <div class="themes-legend">
          <span class="themes-legend-item"><strong>1.</strong> Ouvrir une catégorie</span>
          <span class="themes-legend-item"><strong>2.</strong> Choisir une série</span>
          <span class="themes-legend-item"><strong>3.</strong> Lancer un exercice</span>
        </div>
      </article>

      <article class="card themes-list-card">
        <h3>Catégories d'affinité</h3>
        <div id="themes-affinity-list" class="affinity-grid"></div>
      </article>
    </section>

    <section id="page-affinity" class="page" aria-labelledby="affinity-title">
      <article class="card">
        <div class="exercise-top-row">
          <button id="affinity-back-btn" class="btn btn-soft has-icon" data-icon="◀">Retour catégories</button>
        </div>
        <h2 id="affinity-title">Catégorie</h2>
        <p id="affinity-subtitle" class="muted"></p>
        <div id="affinity-theme-list" class="theme-accordion"></div>
      </article>
    </section>`;
}

function renderProgressProfile() {
  return `    <section id="page-progress" class="page" aria-labelledby="progress-title">
      <article class="card">
        <h2 id="progress-title">Progression</h2>
        <div class="stats-grid">
          <div class="stat"><p>Terminés</p><strong id="progress-stat-completed">0 / 0</strong></div>
          <div class="stat"><p>Taux</p><strong id="progress-stat-rate">0%</strong></div>
          <div class="stat"><p>Série</p><strong id="progress-stat-streak">0 jour</strong></div>
          <div class="stat"><p>Palier</p><strong id="progress-stat-level">Démarrage</strong></div>
        </div>
      </article>

      <article class="card">
        <h2>Courbe (30 jours)</h2>
        <svg id="progress-curve" viewBox="0 0 860 220" role="img" aria-label="Courbe de progression"></svg>
      </article>

      <article class="card">
        <h2>Rapport d'usabilite</h2>
        <div id="progress-usability-summary" class="stats-grid">
          <div class="stat"><p>Feedbacks</p><strong>0</strong></div>
          <div class="stat"><p>Difficulte</p><strong>-</strong></div>
          <div class="stat"><p>Clarte</p><strong>-</strong></div>
          <div class="stat"><p>Autonomie</p><strong>-</strong></div>
        </div>
        <ul id="progress-usability-list" class="profile-tips">
          <li>Aucun retour QCM enregistre pour le moment.</li>
        </ul>
      </article>
    </section>

    <section id="page-profile" class="page" aria-labelledby="profile-title">
      <article class="card">
        <h2 id="profile-title">Profil utilisateur</h2>
        <p class="muted">Sauvegarde automatique dans le dossier utilisateur: <code>Dossier utilisateur &gt; ProgressionAtelier</code>.</p>
        <p id="progress-user-path" class="muted status-line">Aucun utilisateur sélectionné.</p>
        <div class="progress-actions">
          <button id="progress-change-user-btn" class="btn btn-soft has-icon" data-icon="👤">Changer d'utilisateur</button>
          <button id="progress-reset-btn" class="btn btn-danger has-icon" data-icon="↺">Réinitialiser progression</button>
          <button id="progress-reset-profile-btn" class="btn btn-danger has-icon" data-icon="🗑">Réinitialiser profil local</button>
        </div>
        <p id="progress-file-status" class="muted status-line"></p>
      </article>

      <article class="card">
        <h2>Conseils</h2>
        <ul class="profile-tips">
          <li>Utilisez un dossier utilisateur dédié par usager (ex: AD) pour éviter tout mélange de progression.</li>
          <li>Le changement d'utilisateur ouvre ce dossier puis recharge automatiquement la progression associée.</li>
          <li>Réinitialiser progression efface uniquement l'avancement des exercices du profil actif.</li>
          <li>Réinitialiser profil local oublie le prénom et le dossier de référence sur cet appareil.</li>
        </ul>
      </article>
    </section>`;
}

function renderUserSetupModal() {
  return `  <div id="user-setup-modal" class="image-modal" style="display:none;" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Configuration utilisateur">
    <div class="modal-content user-setup-content">
      <h2 style="margin-top:0;">Configuration utilisateur</h2>
      <p class="muted">La première fois, sélectionnez votre dossier de travail dans <code>Documents</code>. Ensuite, votre profil est mémorisé automatiquement.</p>
      <p id="user-setup-status" class="muted status-line">Choisissez votre dossier de travail pour commencer.</p>

      <div style="margin-top:12px;display:grid;gap:10px;">
        <div id="user-setup-saved-folders-wrap" style="display:none;">
          <label for="user-setup-saved-folders-select" class="field" style="margin-bottom:6px;">Dossiers de travail enregistrés</label>
          <select id="user-setup-saved-folders-select"></select>
        </div>

        <button id="user-setup-pick-root-btn" class="btn btn-soft has-icon" data-icon="📁" type="button" style="display:none;">Ajouter un dossier de travail</button>

        <label for="user-setup-firstname-input" class="field" style="margin-bottom:0;">Votre prénom</label>
        <input id="user-setup-firstname-input" type="text" maxlength="30" placeholder="Ex: Alice" style="border:2px solid var(--line);border-radius:10px;padding:10px;font:inherit;">
      </div>

      <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px;">
        <button id="user-setup-cancel-btn" class="btn btn-soft" type="button">Annuler</button>
        <button id="user-setup-validate-btn" class="btn has-icon" data-icon="✓" type="button">Valider</button>
      </div>
    </div>
  </div>`;
}

function renderExerciseFeedbackModal() {
  return `  <div id="exercise-feedback-modal" class="image-modal" style="display:none;" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Questionnaire de fin d'exercice">
    <div class="modal-content user-setup-content save-reminder-content">
      <h2 id="exercise-feedback-title" style="margin-top:0;">Avant de terminer</h2>
      <p id="exercise-feedback-intro" class="muted">Donnez un retour rapide sur cet exercice.</p>
      <form id="exercise-feedback-form" style="display:grid;gap:12px;">
        <label class="field" for="exercise-feedback-difficulty">Difficulte ressentie</label>
        <select id="exercise-feedback-difficulty" required>
          <option value="">Choisir</option>
          <option value="easy">Trop facile</option>
          <option value="adapted">Adaptee</option>
          <option value="hard">Difficile</option>
        </select>

        <label class="field" for="exercise-feedback-clarity">Clarte des consignes</label>
        <select id="exercise-feedback-clarity" required>
          <option value="">Choisir</option>
          <option value="unclear">Pas claire</option>
          <option value="medium">Moyenne</option>
          <option value="clear">Tres claire</option>
        </select>

        <label class="field" for="exercise-feedback-autonomy">Autonomie ressentie</label>
        <select id="exercise-feedback-autonomy" required>
          <option value="">Choisir</option>
          <option value="assisted">J'ai eu besoin d'aide</option>
          <option value="partial">Un peu d'aide</option>
          <option value="independent">En autonomie</option>
        </select>

        <label class="field" for="exercise-feedback-comment">Commentaire optionnel</label>
        <textarea id="exercise-feedback-comment" rows="3" maxlength="280" placeholder="Blocage, point confus, aide recue..."></textarea>
        <p id="exercise-feedback-status" class="muted status-line"></p>
      </form>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end;">
        <button id="exercise-feedback-cancel-btn" class="btn btn-soft" type="button">Annuler</button>
        <button id="exercise-feedback-continue-btn" class="btn has-icon" data-icon="âœ“" type="button">Terminer l'exercice</button>
      </div>
    </div>
  </div>`;
}

export async function syncAppHtml({ appRoot, appName, logger = console }) {
  if (!appRoot) throw new Error("appRoot est requis");
  if (!appName) throw new Error("appName est requis");

  const indexPath = path.join(appRoot, "index.html");
  const packageJson = JSON.parse(await fs.readFile(path.join(appRoot, "package.json"), "utf8"));
  const version = packageJson.version || "0.0.0";
  const current = await fs.readFile(indexPath, "utf8");

  let next = current;
  next = replaceMarkedBlock(next, SHARED_SCRIPT_BLOCK, renderScriptTags(), indexPath);
  next = replaceMarkedBlock(next, SHARED_HEADER_NAV_BLOCK, renderHeaderNav({ appName, version }), indexPath);
  next = replaceMarkedBlock(next, SHARED_OVERVIEW_PAGES_BLOCK, renderOverviewPages(), indexPath);
  next = replaceMarkedBlock(next, SHARED_PROGRESS_PROFILE_BLOCK, renderProgressProfile(), indexPath);
  next = replaceMarkedBlock(next, SHARED_USER_SETUP_BLOCK, renderUserSetupModal(), indexPath);
  next = replaceMarkedBlock(next, SHARED_EXERCISE_FEEDBACK_BLOCK, renderExerciseFeedbackModal(), indexPath);

  if (next !== current) {
    await fs.writeFile(indexPath, next, "utf8");
    logger.log("[sync-app-html] Blocs HTML partages mis a jour.");
    return true;
  }

  logger.log("[sync-app-html] Blocs HTML deja a jour.");
  return false;
}
