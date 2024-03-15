import { useState } from "react";
import type { ListTodosQuery } from "../../API";
import { client } from "../../utils/amplifyClientUtils";
import type { Schema } from "../../amplify/data/resource";
import { TodoPriority } from "../../API";

type Todo = Schema["Todo"];

export const TodoList = (props: { todos: ListTodosQuery }) => {
  const [todos, setTodos] = useState<Todo[]>(
    props.todos.listTodos?.items as Todo[]
  );

  const createTodo = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      content: { value: string };
      priority: { value: TodoPriority };
    };

    const todo = {
      content: target.content.value,
      priority: target.priority.value,
      done: false,
    };

    try {
      const { data: newTodo, errors } = await client.models.Todo.create(todo, {
        authMode: "userPool",
      });

      setTodos((prev) => [...prev, newTodo]);

      target.content.value = "";
      target.priority.value = TodoPriority.low;
    } catch (error) {
      window.alert(error);
    }
  };

  const completeTodo = async (
    id: string,
    currentStatus: boolean | null = false
  ) => {
    const { data: updatedTodo, errors } = await client.models.Todo.update({
      id,
      done: !currentStatus,
    });

    const updatedTodoIndex = todos.findIndex((todo) => todo.id === id);

    const updatedTodos = [...todos];
    updatedTodos[updatedTodoIndex] = updatedTodo;

    setTodos(updatedTodos);
  };

  return (
    <>
      <form id="create-todo-form" onSubmit={createTodo}>
        <h2>Create a Todo</h2>
        <input name="content" placeholder="walk the dog" />
        <div className="select-wrapper">
          <select id="select" name="priority">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>

        <button id="create-todo-button">Create Todo</button>
      </form>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1em",
          marginTop: "4em",
        }}
      >
        {todos.map((todo) => {
          if (todo) {
            return (
              <div className="todo-card" key={todo?.id}>
                <p>Task: {todo.content}</p>
                <p>Priority: {todo.priority}</p>
                <p>Done: {todo.done ? "✅" : "❌"}</p>

                <button
                  className="complete-todo-button"
                  onClick={() => completeTodo(todo.id, todo.done)}
                >
                  Complete
                </button>
              </div>
            );
          }
        })}
      </div>
    </>
  );
};
