import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import CS100 from '../components/CS100';
import CS101 from '../components/CS101';
import CS102 from '../components/CS102';
import CS103 from '../components/CS103';
import CoursesNavbar from '../components/CoursesNavbar';

const CoursesPage = () => {
  const { colors } = useTheme();
  const [userName, setUserName] = useState('User');
  const [isLoading, setIsLoading] = useState(true);
  const [instructorCourses, setInstructorCourses] = useState([]);

  // State for hover effects on course cards
  const [hoveredCard, setHoveredCard] = useState(null);
  // State to store the selected course for the modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  // State to control the modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get the instructor document from Firestore
          const instructorDoc = await getDoc(doc(db, 'instructors', user.uid));
          
          if (instructorDoc.exists()) {
            // If instructor document exists, get the data
            const instructorData = instructorDoc.data();
            console.log('Instructor data:', instructorData);
            
            // Set the instructor's name from the data
            setUserName(instructorData.name || 'User');
            
            // Get courses array from instructor data
            if (instructorData.courses && Array.isArray(instructorData.courses)) {
              setInstructorCourses(instructorData.courses);
            } else {
              setInstructorCourses([]);
            }
          } else {
            console.log('No instructor document found for user');
            // If no instructor document found, fallback to email
            setUserName(user.email?.split('@')[0] || 'User');
            setInstructorCourses([]);
          }
        } catch (error) {
          console.error('Error fetching instructor data:', error);
          setUserName('User');
          setInstructorCourses([]);
        }
      } else {
        console.log('No user is signed in');
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleMouseOver = (cardId) => setHoveredCard(cardId);
  const handleMouseOut = () => setHoveredCard(null);

  // Handler for clicking on a course card
  const handleCourseCardClick = (courseId) => {
    console.log('Selected course:', courseId);
    setSelectedCourse(courseId);
  };

  // Handlers for modal control
  const openModal = () => {
    if (selectedCourse) { // Only open modal if a course is selected
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null); // Deselect course when modal is closed
  };

  // Styles for the course cards, with hover and selected effect
  const getCourseCardStyle = (cardId) => ({
    backgroundColor: colors.cardBackground,
    borderRadius: '16px',
    boxShadow: hoveredCard === cardId
      ? '0 8px 30px rgba(0,0,0,0.1)'
      : selectedCourse === cardId
        ? '0 4px 25px rgba(0,0,0,0.1)' // Slightly different shadow for selected
        : '0 4px 20px rgba(0,0,0,0.05)', // Default shadow
    padding: '24px',
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer', // Indicate interactivity
    border: selectedCourse === cardId 
      ? '3px solid #1a237e' // Using a specific color for the border
      : '1px solid transparent', // Default transparent border
    transform: hoveredCard === cardId ? 'translateY(-5px)' : 'translateY(0)', // Slight lift on hover
    outline: selectedCourse === cardId ? '2px solid rgba(26, 35, 126, 0.4)' : 'none', // Add a subtle outline for selected card
  });

  // Function to get the appropriate component based on course ID
  const getCourseComponent = (courseId) => {
    const courseIdLower = courseId.toLowerCase();
    switch (courseIdLower) {
      case 'cs1':
        return <CS100 title={courseId} />;
      case 'cs2':
        return <CS101 title={courseId} />;
      case 'cs701':
        return <CS102 title={courseId} />;
      default:
        return <CS103 title={courseId} />;
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Outfit', sans-serif",
      }}>
        <h2 style={{ color: colors.text }}>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <CoursesNavbar
        openModal={openModal}
        closeModal={closeModal}
        isModalOpen={isModalOpen}
        selectedCourse={selectedCourse}
      />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        paddingTop: '84px',
      }}>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
            color: colors.text,
            fontSize: '1.8rem',
            marginBottom: '24px',
            textAlign: 'left',
          }}>
          Welcome back, {userName}!
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {instructorCourses.length > 0 ? (
            instructorCourses.map((courseId) => (
              <div
                key={courseId}
                style={getCourseCardStyle(courseId.toLowerCase())}
                onMouseOver={() => handleMouseOver(courseId.toLowerCase())}
                onMouseOut={handleMouseOut}
                onClick={() => handleCourseCardClick(courseId.toLowerCase())}
              >
                {getCourseComponent(courseId)}
              </div>
            ))
          ) : (
            <div style={{
              ...getCourseCardStyle('no-courses'),
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '48px',
            }}>
              <h3 style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600,
                fontSize: '1.2rem',
                color: colors.text,
                marginBottom: '16px',
              }}>
                There are no courses for {userName} yet!
              </h3>
              <p style={{
                color: colors.textSecondary,
                fontSize: '1rem',
              }}>
                Please contact your administrator to add courses to your account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage; 