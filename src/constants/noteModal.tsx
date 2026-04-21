import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { color } from '../color/color';
import SvgIcons from '../components/SvgIcons';
import { logger } from '../utils/logger';
import { styles } from './noteModal.styles';

interface NoteModalProps {
    visible: boolean;
    onAddNote: (note: string) => void;
    onCancel: () => void;
    initialNote?: string;
    scannedData?: string | null;
}

const NoteModal: React.FC<NoteModalProps> = ({
    visible,
    onAddNote,
    onCancel,
    initialNote,
    scannedData,
}) => {
    const [noteText, setNoteText] = useState('');

    useEffect(() => {
        if (initialNote) setNoteText(initialNote);
    }, [initialNote]);

    const handleAddNote = () => {
        if (!scannedData) {
            logger.warn('Cannot add note: scannedData is null');
            return;
        }
        if (noteText.trim().length > 0) {
            onAddNote(noteText);
            setNoteText('');
        } else {
            onAddNote('');
        }
    };

    const isUpdate = !!initialNote;

    return (
        <Modal animationType="slide" transparent={true} visible={visible}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
                        <SvgIcons.CrossIconBrownbg width={24} height={24} />
                    </TouchableOpacity>
                    <Text style={styles.modalText}>{isUpdate ? 'Update Note' : 'Add Note'}</Text>
                    <TextInput
                        style={[styles.noteInput, { textAlignVertical: 'top' }]}
                        multiline={true}
                        numberOfLines={4}
                        onChangeText={setNoteText}
                        value={noteText}
                        selectionColor={color.selectField_CEBCA0}
                        placeholder="Add your note here..."
                        placeholderTextColor={color.black_544B45}
                    />
                    <TouchableOpacity style={styles.button} onPress={handleAddNote}>
                        <Text style={styles.buttonText}>{isUpdate ? 'Update' : 'Add'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default NoteModal;
