async function loadProfile() {
    try {
        const btnSave = document.querySelector('.btn-save');
        if (btnSave) btnSave.innerText = 'Đang tải thông tin cũ...';
        
        const user = await fetchUser();
        if (user) {
            document.getElementById('userId').value = user.id;
            document.getElementById('p_username').value = user.username || '';
            document.getElementById('p_email').value = user.email || '';
            document.getElementById('p_lastname').value = user.lastname || '';
            document.getElementById('p_firstname').value = user.firstname || '';
            document.getElementById('p_phone').value = user.phone || '';
            document.getElementById('p_address').value = user.address || '';
        }
        if (btnSave) btnSave.innerText = 'Lưu thay đổi';
    } catch (error) {
        console.error("Lỗi khi tải thông tin:", error);
        const btnSave = document.querySelector('.btn-save');
        if (btnSave) btnSave.innerText = 'Lưu thay đổi';
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    const userId = document.getElementById('userId').value;
    const data = {
        username: document.getElementById('p_username').value,
        email: document.getElementById('p_email').value,
        lastname: document.getElementById('p_lastname').value,
        firstname: document.getElementById('p_firstname').value,
        phone: document.getElementById('p_phone').value,
        address: document.getElementById('p_address').value
    };

    try {
        const response = await fetch(`${API_URL}/api/users/${userId}`, {
            method: "PUT",
            headers: { ...defaultHeader },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            successMsg.style.display = 'block';
            document.getElementById('username').innerText = data.username;
        } else {
            let msg = await response.text();
            try {
                const errObj = JSON.parse(msg);
                msg = errObj.message || errObj.error || msg;
            } catch(e) {}
            errorMsg.innerText = msg;
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.innerText = "Lỗi kết nối đến máy chủ";
        errorMsg.style.display = 'block';
    }
}

window.addEventListener("DOMContentLoaded", () => {
    loadProfile();
});