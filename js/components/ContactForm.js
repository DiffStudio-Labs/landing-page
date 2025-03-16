export function initContactForm() {
    emailjs.init("yXW6dOUMMhBYkTH05");

    document.getElementById('contactForm').addEventListener('submit', handleSubmit);
}

function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const message = form.querySelector('textarea').value.trim();

    if (!validateForm(name, email, message)) return;

    sendEmail(form, name, email, message);
}

function validateForm(name, email, message) {
    if (!name || !email || !message) {
        alert('Please fill out all fields');
        return false;
    }

    if (name.length < 2) {
        alert('Name must be at least 2 characters long');
        return false;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }

    if (message.length < 10) {
        alert('Message must be at least 10 characters long');
        return false;
    }

    return true;
}

function sendEmail(form, name, email, message) {
    const button = form.querySelector('button');
    const originalText = button.textContent;
    button.textContent = 'Sending...';
    button.disabled = true;

    emailjs.send("service_5jj1zzu", "template_2g033mt", {
        from_name: name,
        email: email,
        message: message,
        to_name: "DiffStudio"
    })
    .then(() => {
        alert(`Thank you ${name} for contacting us! We'll get back to you soon.`);
        form.reset();
        button.textContent = originalText;
        button.disabled = false;
    }, (error) => {
        alert('Failed to send message. Please try again later.');
        console.error('EmailJS error:', error);
        button.textContent = originalText;
        button.disabled = false;
    });
}