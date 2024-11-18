import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, FlatList, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Task = {
  id: string;
  text: string;
  completed: boolean;
};

export default function App(): JSX.Element {
  const [task, setTask] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [animations, setAnimations] = useState<Map<string, Animated.Value>>(new Map());

  const loadTasks = async (): Promise<void> => {
    const savedTasks = await AsyncStorage.getItem('tasks');
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks);
      setTasks(parsedTasks);

      const newAnimations = new Map<string, Animated.Value>();
      parsedTasks.forEach((task: Task) => {
        newAnimations.set(task.id, new Animated.Value(task.completed ? 1 : 1)); 
      });
      setAnimations(newAnimations);
    }
  };

  const saveTasks = async (tasks: Task[]): Promise<void> => {
    await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = (): void => {
    if (task.trim()) {
      const newTask: Task = { id: Date.now().toString(), text: task, completed: false };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      setTask('');
  
      setAnimations((prevAnimations) => {
        const newAnimations = new Map(prevAnimations);
        newAnimations.set(newTask.id, new Animated.Value(1)); 
        return newAnimations;
      });
    }
    
  };

  // Toggle completion status and update opacity animation
  const toggleCompletion = (taskId: string): void => {
    const updatedTasks = tasks.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);

  
  };

  // Edit an existing task
  const editTask = (taskId: string): void => {
    const taskToEdit = tasks.find((item) => item.id === taskId);
    if (taskToEdit) {
      setTask(taskToEdit.text);
      setEditingTask(taskId);
    }
  };

  // Update the task's text
  const updateTask = (): void => {
    if (task.trim() && editingTask) {
      const updatedTasks = tasks.map((item) =>
        item.id === editingTask ? { ...item, text: task } : item
      );
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      setTask('');
      setEditingTask(null);
    }
  };


  // Delete a task with a fade-out animation
  const deleteTask = (taskId: string): void => {
    const fadeValue = animations.get(taskId);
    if (fadeValue) {
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        const updatedTasks = tasks.filter((item) => item.id !== taskId);
        setTasks(updatedTasks);
        saveTasks(updatedTasks);
        setAnimations((prevAnimations) => {
          const newAnimations = new Map(prevAnimations);
          newAnimations.delete(taskId); // Remove animation for deleted task
          return newAnimations;
        });
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple To-Do List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={task}
          onChangeText={(text) => setTask(text)}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={editingTask ? updateTask : addTask}
        >
          <Text style={styles.addButtonText}>{editingTask ? '✓' : '+'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        renderItem={({ item }) => {
          const fadeAnim = animations.get(item.id) || new Animated.Value(0); // Use animation value

          return (
            <Animated.View
              style={[
                styles.taskContainer,
                { 
                  opacity: fadeAnim, // Apply opacity animation
                  backgroundColor: item.completed ? 'lightgreen' : '#FFFFFF', 
                },
              ]}
            >
              <TouchableOpacity style={[{ flex: 1 }]} onPress={() => toggleCompletion(item.id)}>
                <Text
                  style={[
                    styles.taskText,
                    item.completed && styles.completedTask,
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => editTask(item.id)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteTask(item.id)}>
                  <Text style={styles.deleteButton}>X</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        }}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA', 
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginBottom: 30,
    textAlign: 'center', 
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  input: {
    flex: 1,
    height: 45,
    borderColor: '#E2E2E2',
    borderWidth: 1.5,
    borderRadius: 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#5C6BC0', 
    height: 45,
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    marginLeft: 15,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  taskContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 15,
    marginBottom: 15, 
    borderWidth: 1,
    borderColor: '#E2E2E2',
    elevation: 2, 
  },
  taskText: {
    fontSize: 18,
    color: '#333',
    flex: 1, 
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#B4B4B4',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    color: '#5C6BC0', 
    marginRight: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    color: '#FF5C5C',
    fontWeight: 'bold',
    fontSize: 18,
  },
});