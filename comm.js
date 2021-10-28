//<script src='https://meet.jit.si/external_api.js'></script>
function comm() {
    let ele = '#comm';
    const e = $('<div>').attr('id', 'comm').css('position', 'fixed').css('width', '700px').css('height', '700px');
    $('body').append(e);

    const domain = 'meet.jit.si';
    const options = {
        roomName: 'netjsvr',
        width: '100%',  height: '100%',
        parentNode: document.querySelector(ele)
    };

    const jitsi = new JitsiMeetExternalAPI(domain, options);
    jitsi.executeCommand('toggleChat');

}