import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { hideNotification } from "../redux/state";
import "../styles/Notification.scss";

const Notification = () => {
  const dispatch = useDispatch();
  const notification = useSelector((state) => state.notification);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer;
    let hideTimer;

    if (notification.isVisible) {
      // Устанавливаем состояние видимости для добавления класса 'show'
      setVisible(true);

      // Таймер для скрытия уведомления после заданной продолжительности
      hideTimer = setTimeout(() => {
        setVisible(false); // Добавляет класс 'hide'
      }, notification.duration || 3000);
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification]);

  // После завершения анимации скрытия, диспатчим действие hideNotification
  const handleTransitionEnd = () => {
    if (!visible && notification.isVisible) {
      dispatch(hideNotification());
    }
  };

  if (!notification.isVisible) return null;

  return (
    <div
      className={`notification ${notification.type} ${
        visible ? "show" : "hide"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      {notification.message}
    </div>
  );
};

export default Notification;
