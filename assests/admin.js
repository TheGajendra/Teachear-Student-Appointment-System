// your Api key here

    firebase.initializeApp(firebaseConfig);
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL); // ✅ Session persistence

    const db = firebase.firestore();
    const auth = firebase.auth();

    const teacherForm = document.getElementById('teacherForm');
    const teacherTableBody = document.querySelector('#teacherTable tbody');
    const studentTableBody = document.querySelector('#studentTable tbody');
    const approvedStudentTableBody = document.querySelector('#approvedStudentTable tbody');

    teacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const department = document.getElementById('department').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const imageUrl = document.getElementById('imageUrl').value.trim(); // New input
        const teacherId = document.getElementById('teacherId').value;

        try {
            if (teacherId) {
                // Update existing teacher
                const updateData = { name, email, department, subject, imageUrl };
                await db.collection('teachers').doc(teacherId).update(updateData);
            } else {
                // Register new teacher
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const uid = userCredential.user.uid;

                await db.collection('teachers').doc(uid).set({
                    name,
                    email,
                    department,
                    subject,
                    imageUrl,
                    role: 'teacher'
                });
            }

            teacherForm.reset();
            document.getElementById('teacherId').value = '';
            loadTeachers();
        } catch (error) {
            console.error("Error adding/updating teacher:", error);
            alert("Error: " + error.message);
        }
    });

    async function loadTeachers() {
        const snapshot = await db.collection('teachers').get();
        teacherTableBody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            teacherTableBody.innerHTML += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.email}</td>
                    <td>${data.department}</td>
                    <td>${data.subject}</td>
                    <td class="action-btns">
                        <button onclick="editTeacher('${doc.id}', '${data.name}', '${data.email}', '${data.department}', '${data.subject}', '${data.imageUrl || ''}')">Edit</button>
                        <button onclick="deleteTeacher('${doc.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
    }

    async function deleteTeacher(id) {
        await db.collection('teachers').doc(id).delete();
        loadTeachers();
    }

    function editTeacher(id, name, email, department, subject, imageUrl) {
        document.getElementById('name').value = name;
        document.getElementById('email').value = email;
        document.getElementById('department').value = department;
        document.getElementById('subject').value = subject;
        document.getElementById('imageUrl').value = imageUrl || '';
        document.getElementById('teacherId').value = id;
    }

    async function loadStudents() {
        const snapshot = await db.collection('students').where('approved', '==', false).get();
        studentTableBody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            studentTableBody.innerHTML += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.email}</td>
                    <td><button onclick="approveStudent('${doc.id}')">Approve</button></td>
                </tr>
            `;
        });
    }

    async function approveStudent(id) {
        await db.collection('students').doc(id).update({ approved: true });
        loadStudents();
        loadApprovedStudents();
    }

    async function loadApprovedStudents() {
        const snapshot = await db.collection('students').where('approved', '==', true).get();
        approvedStudentTableBody.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            approvedStudentTableBody.innerHTML += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.email}</td>
                    <td>${data.educationLevel || ''}</td>
                    <td>${data.phone || ''}</td>
                </tr>
            `;
        });
    }

    // Initial Loads
    loadTeachers();
    loadStudents();
    loadApprovedStudents();
