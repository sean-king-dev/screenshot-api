document.getElementById('download').onclick = async () => {
    const response = await fetch('/download-pdf', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            url: window.location.href
        })
    });

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createdObjectURL(blob);
    link.download = 'page-pdf';
    link.click();
}