 // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDRYqgVtx8Rt2aovcYpjblmI34klFc2X_0",
            authDomain: "teachconnect-70753.firebaseapp.com",
            projectId: "teachconnect-70753",
            storageBucket: "teachconnect-70753.firebasestorage.app",
            messagingSenderId: "1064030232896",
            appId: "1:1064030232896:web:afca52e5a00554fe77daa5"
        };

        firebase.initializeApp(firebaseConfig);
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const db = firebase.firestore();
        const auth = firebase.auth();

        // DOM elements
        const teacherName = document.getElementById('teacherName');
        const appointmentsTable = document.querySelector('#appointmentsTable tbody');
        const messagesTable = document.querySelector('#messagesTable tbody');
        const appointmentsCount = document.getElementById('appointmentsCount');
        const approvedCount = document.getElementById('approvedCount');
        const messagesCount = document.getElementById('messagesCount');

        // Auto login check
        auth.onAuthStateChanged(async user => {
            if (user) {
                try {
                    const doc = await db.collection('teachers').doc(user.uid).get();
                    if (doc.exists) {
                        teacherName.textContent = `Welcome, ${doc.data().name}`;
                        loadAppointments(user.uid);
                        loadMessages(user.uid);
                    } else {
                        alert("Teacher not found.");
                        auth.signOut();
                    }
                } catch (error) {
                    console.error("Error fetching teacher data:", error);
                }
            } else {
                window.location.href = 'login.html';
            }
        });

        // Schedule Appointment
        document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const studentName = document.getElementById('studentName').value;
            const appointmentDateTime = document.getElementById('appointmentDateTime').value;
            const teacherId = auth.currentUser.uid;

            try {
                await db.collection('appointments').add({
                    teacherId,
                    studentName,
                    appointmentDateTime,
                    status: 'pending',
                    timestamp: new Date()
                });

                document.getElementById('appointmentForm').reset();
                loadAppointments(teacherId);
            } catch (error) {
                console.error("Error scheduling appointment:", error);
                alert("Failed to schedule appointment. Please try again.");
            }
        });

        // Load Appointments
        async function loadAppointments(teacherId) {
            const snapshot = await db.collection('appointments').where('teacherId', '==', teacherId).orderBy('timestamp', 'desc').get();
            appointmentsTable.innerHTML = '';
            
            let total = 0;
            let approved = 0;
            
            if (snapshot.empty) {
                appointmentsTable.innerHTML = `
                    <tr>
                        <td colspan="4" class="no-data">
                            <i class="fas fa-calendar-times"></i>
                            <p>No appointments scheduled yet</p>
                        </td>
                    </tr>
                `;
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    total++;
                    if (data.status === 'approved') approved++;
                    
                    const formattedDate = new Date(data.appointmentDateTime).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    appointmentsTable.innerHTML += `
                        <tr>
                            <td>${data.studentName}</td>
                            <td>${formattedDate}</td>
                            <td><span class="status-badge status-${data.status}">${data.status}</span></td>
                            <td class="action-btns">
                                <button class="action-btn btn-approve" onclick="updateStatus('${doc.id}', 'approved')">
                                    <i class="fas fa-check"></i> Approve
                                </button>
                                <button class="action-btn btn-cancel" onclick="updateStatus('${doc.id}', 'cancelled')">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }
            
            appointmentsCount.textContent = total;
            approvedCount.textContent = approved;
        }

        // Update appointment status
        async function updateStatus(id, status) {
            try {
                await db.collection('appointments').doc(id).update({ status });
                loadAppointments(auth.currentUser.uid);
            } catch (error) {
                console.error("Error updating appointment status:", error);
                alert("Failed to update appointment status. Please try again.");
            }
        }

        // Load Messages
        async function loadMessages(teacherId) {
            const snapshot = await db.collection('messages').where('teacherId', '==', teacherId).orderBy('timestamp', 'desc').get();
            messagesTable.innerHTML = '';
            
            let count = 0;
            
            if (snapshot.empty) {
                messagesTable.innerHTML = `
                    <tr>
                        <td colspan="3" class="no-data">
                            <i class="fas fa-comment-slash"></i>
                            <p>No messages received yet</p>
                        </td>
                    </tr>
                `;
            } else {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    count++;
                    
                    const formattedDate = new Date(data.timestamp.toDate()).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    // Truncate long messages
                    const truncatedMessage = data.message.length > 60 ? 
                        data.message.substring(0, 60) + '...' : data.message;
                    
                    messagesTable.innerHTML += `
                        <tr>
                            <td>${data.from}</td>
                            <td title="${data.message}">${truncatedMessage}</td>
                            <td>${formattedDate}</td>
                        </tr>
                    `;
                });
            }
            
            messagesCount.textContent = count;
        }

        // Logout function
        function logout() {
            auth.signOut();
        }

        // Set min date/time for appointment to today
        document.addEventListener('DOMContentLoaded', function() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            document.getElementById('appointmentDateTime').min = minDateTime;
        });