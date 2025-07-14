  const firebaseConfig = {
            apiKey: "AIzaSyDRYqgVtx8Rt2aovcYpjblmI34klFc2X_0",
            authDomain: "teachconnect-70753.firebaseapp.com",
            projectId: "teachconnect-70753",
            storageBucket: "teachconnect-70753.appspot.com",
            messagingSenderId: "1064030232896",
            appId: "1:1064030232896:web:afca52e5a00554fe77daa5"
        };

        firebase.initializeApp(firebaseConfig);
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const db = firebase.firestore();
        const auth = firebase.auth();

        let selectedTeacherId = "";
        let selectedTeacherName = "";
        let studentName = "";

        auth.onAuthStateChanged(async user => {
            if (user) {
                try {
                    const studentDoc = await db.collection("students").doc(user.uid).get();
                    if (studentDoc.exists) {
                        studentName = studentDoc.data().name;
                        document.getElementById("studentName").textContent = `Welcome, ${studentName}`;
                        loadTeachers();
                        loadStudentAppointments(user.uid);
                    } else {
                        alert("Student not found.");
                        auth.signOut();
                    }
                } catch (error) {
                    console.error("Error fetching student data:", error);
                }
            } else {
                window.location.href = "login.html";
            }
        });

        async function loadTeachers() {
            const snapshot = await db.collection("teachers").get();
            const teacherCards = document.getElementById("teacherCards");
            teacherCards.innerHTML = "";

            snapshot.forEach(doc => {
                const data = doc.data();
                const image = data.imageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80";
                teacherCards.innerHTML += `
                    <div class="card">
                        <img src="${image}" alt="${data.name}" class="card-img">
                        <div class="card-content">
                            <div class="card-header">
                                <h3 class="card-title">${data.name}</h3>
                                <span class="card-badge">Available</span>
                            </div>
                            <div class="card-details">
                                <div class="detail-item">
                                    <div class="detail-icon"><i class="fas fa-book"></i></div>
                                    <div class="detail-text">Subject: ${data.subject}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-icon"><i class="fas fa-building"></i></div>
                                    <div class="detail-text">Department: ${data.department}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-icon"><i class="fas fa-star"></i></div>
                                    <div class="detail-text">Rating: 4.8/5 (42 reviews)</div>
                                </div>
                            </div>
                            <div class="card-footer">
                                <button class="card-btn" onclick="openModal('${doc.id}', '${data.name}')">
                                    <i class="fas fa-calendar-plus"></i> Book Appointment
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        async function loadStudentAppointments(uid) {
            const snapshot = await db.collection("appointments")
                .where("studentId", "==", uid)
                .orderBy("timestamp", "desc")
                .get();

            const appointmentsList = document.getElementById("appointmentsList");
            appointmentsList.innerHTML = '';

            if (snapshot.empty) {
                appointmentsList.innerHTML = `
                    <div class="no-appointments">
                        <i class="fas fa-calendar-times"></i>
                        <h3>No Appointments Scheduled</h3>
                        <p>You haven't booked any appointments yet. Find a teacher and schedule one now!</p>
                    </div>
                `;
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const statusClass = data.status === 'approved' ? 'status-approved' : 
                                  data.status === 'rejected' ? 'status-rejected' : 'status-pending';
                
                const formattedDate = new Date(data.appointmentDateTime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                appointmentsList.innerHTML += `
                    <div class="appointment-card">
                        <div class="appointment-header">
                            <h3 class="appointment-title">${data.teacherName || "Teacher"}</h3>
                            <span class="appointment-status ${statusClass}">${data.status}</span>
                        </div>
                        <div class="appointment-details">
                            <div class="appointment-detail">
                                <div class="appointment-icon"><i class="fas fa-calendar-day"></i></div>
                                <div class="appointment-text">
                                    <span class="appointment-date">${formattedDate}</span>
                                </div>
                            </div>
                            <div class="appointment-detail">
                                <div class="appointment-icon"><i class="fas fa-user-graduate"></i></div>
                                <div class="appointment-text">Student: ${data.studentName}</div>
                            </div>
                            <div class="appointment-detail">
                                <div class="appointment-icon"><i class="fas fa-info-circle"></i></div>
                                <div class="appointment-text">Appointment ID: ${doc.id.substring(0, 8)}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        function openModal(teacherId, teacherName) {
            selectedTeacherId = teacherId;
            selectedTeacherName = teacherName;
            document.getElementById("modalTeacherName").textContent = `With: ${teacherName}`;
            document.getElementById("bookingModal").classList.add("active");
        }

        function closeModal() {
            document.getElementById("bookingModal").classList.remove("active");
        }

        async function confirmBooking() {
            const datetime = document.getElementById("appointmentDate").value;
            if (!datetime) {
                alert("Please select a date and time.");
                return;
            }
            
            try {
                await db.collection("appointments").add({
                    teacherId: selectedTeacherId,
                    teacherName: selectedTeacherName,
                    studentId: auth.currentUser.uid,
                    studentName: studentName,
                    appointmentDateTime: datetime,
                    status: "pending",
                    timestamp: new Date()
                });

                alert("Appointment booked successfully!");
                closeModal();
                loadStudentAppointments(auth.currentUser.uid);
            } catch (error) {
                console.error("Error booking appointment:", error);
                alert("Failed to book appointment. Please try again.");
            }
        }

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
            document.getElementById('appointmentDate').min = minDateTime;
        });