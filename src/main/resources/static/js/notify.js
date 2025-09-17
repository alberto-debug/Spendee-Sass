// Lightweight notification system using Bootstrap alerts
(function(){
    function ensureContainer() {
        let c = document.querySelector('.alert-stack');
        if (!c) {
            c = document.createElement('div');
            c.className = 'alert-stack';
            document.body.appendChild(c);
            adjustPosition(c);
            window.addEventListener('resize', () => adjustPosition(c));
        }
        return c;
    }

    function adjustPosition(container){
        const nav = document.querySelector('.sticky-navbar, nav.navbar');
        let offset = 70; // default fallback
        if (nav) {
            const rect = nav.getBoundingClientRect();
            offset = rect.height + 8; // small gap below navbar
        }
        container.style.top = offset + 'px';
    }

    function injectStyle() {
        if (document.getElementById('notify-style')) return;
        const style = document.createElement('style');
        style.id = 'notify-style';
        style.textContent = `
        .alert-stack { position: fixed; top: 78px; right: 16px; z-index:10510; display:flex; flex-direction:column; gap:6px; max-width:300px; }
        .alert-stack .alert { box-shadow:0 3px 10px rgba(0,0,0,0.12); animation:fadeSlideIn .30s ease; padding:4px 18px 4px 8px; font-size:0.75rem; line-height:1.15rem; border-radius:6px; margin:0; position:relative; }
        .alert-stack .alert .btn-close { position:absolute; top:4px; right:6px; width:0.55em; height:0.55em; font-size:0.55rem; opacity:0.55; padding:0; background-size:0.55em; }
        .alert-stack .alert .btn-close:hover { opacity:0.85; }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-4px);} to {opacity:1; transform:translateY(0);} }
        `;
        document.head.appendChild(style);
    }

    function mapType(type){
        switch(type){
            case 'success': return 'success';
            case 'error': return 'danger';
            case 'warning': return 'warning';
            case 'info': default: return 'info';
        }
    }

    function show(message, type='info', duration=5000) {
        injectStyle();
        const container = ensureContainer();
        const bsType = mapType(type);
        const alert = document.createElement('div');
        alert.className = `alert alert-${bsType} alert-dismissible fade show`; 
        alert.setAttribute('role','alert');
        alert.innerHTML = `
            <span>${message}</span>
            <button type="button" class="btn-close" aria-label="Close"></button>
        `;
        const closeBtn = alert.querySelector('.btn-close');
        closeBtn.addEventListener('click', () => removeAlert(alert));
        container.appendChild(alert);
        if (duration > 0) {
            setTimeout(() => removeAlert(alert), duration);
        }
    }

    function removeAlert(alert) {
        if (!alert) return;
        alert.classList.remove('show');
        alert.classList.add('hide');
        setTimeout(()=>{ if(alert && alert.parentNode){ alert.parentNode.removeChild(alert); }}, 300);
    }

    const api = {
        show,
        success: (m,d)=>show(m,'success',d),
        error: (m,d)=>show(m,'error',d),
        warning: (m,d)=>show(m,'warning',d),
        info: (m,d)=>show(m,'info',d)
    };

    window.notify = api;
})();
