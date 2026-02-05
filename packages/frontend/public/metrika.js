(function bootstrapYM(){
  var COUNTER_ID = 106632112;
  var initDone = false;
  var maxRetries = 20;
  var retryDelay = 300; // ms

  function doInit() {
    if (initDone) return true;
    if (typeof window === undefined) return false;
    var ymFn = window[ym];
    if (typeof ymFn !== function) return false;
    ymFn(COUNTER_ID, init, {
      defer: true,
      webvisor: true,
      trackHash: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      ecommerce: dataLayer
    });
    // отправляем стартовый hit для текущей страницы
    ymFn(COUNTER_ID, hit, window.location.href, {
      title: document.title,
      referer: document.referrer
    });
    initDone = true;
    return true;
  }

  (function waitYm(attempt){
    if (doInit()) return;
    if (attempt >= maxRetries) return;
    setTimeout(function(){ waitYm(attempt + 1); }, retryDelay);
  })(0);
})();
