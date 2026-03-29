import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useDispatch, useSelector } from 'react-redux';
import { colors, fonts, spacing, borderRadius } from '@training-grounds/shared';
import type { ClassSession, Discipline } from '@training-grounds/shared';
import type { AppDispatch, RootState } from '../../redux/store';
import { checkIn } from '../../redux/slices/attendanceSlice';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  'bjj-gi': 'BJJ Gi',
  'bjj-nogi': 'BJJ No-Gi',
  'muay-thai': 'Muay Thai',
  wrestling: 'Wrestling',
  mma: 'MMA',
  boxing: 'Boxing',
  'open-mat': 'Open Mat',
};

type CheckInMode = 'scan' | 'manual' | 'confirm';

export const CheckInScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isCheckingIn } = useSelector((state: RootState) => state.attendance);

  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<CheckInMode>('scan');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);

  // Placeholder classes for manual selection
  const [availableClasses] = useState<ClassSession[]>([
    {
      id: '1',
      name: 'Morning BJJ Fundamentals',
      discipline: 'bjj-gi',
      instructorId: 'coach-1',
      instructorName: 'Coach Mike',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 60,
      capacity: 30,
      enrolledCount: 18,
      level: 'All Levels',
    },
    {
      id: '2',
      name: 'No-Gi Advanced',
      discipline: 'bjj-nogi',
      instructorId: 'coach-2',
      instructorName: 'Coach Sarah',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 90,
      capacity: 25,
      enrolledCount: 12,
      level: 'Advanced',
    },
    {
      id: '3',
      name: 'Muay Thai Striking',
      discipline: 'muay-thai',
      instructorId: 'coach-3',
      instructorName: 'Coach Danny',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 60,
      capacity: 20,
      enrolledCount: 15,
      level: 'Intermediate',
    },
  ]);

  const handleBarCodeScanned = (result: { data: string }) => {
    if (scannedData) return; // prevent double-scan
    setScannedData(result.data);
    setMode('confirm');
  };

  const handleConfirmCheckIn = async () => {
    const classId = selectedClass?.id ?? scannedData;
    if (!classId) return;

    try {
      await dispatch(
        checkIn({ classId, qrCode: scannedData ?? undefined }),
      ).unwrap();
      Alert.alert(
        'Checked In!',
        `You're checked in${selectedClass ? ` to ${selectedClass.name}` : ''}. Keep training!`,
        [
          {
            text: 'Done',
            onPress: () => {
              setMode('scan');
              setScannedData(null);
              setSelectedClass(null);
            },
          },
        ],
      );
    } catch {
      Alert.alert('Check-in Failed', 'Please try again or select a class manually.');
    }
  };

  const handleSelectClass = (cls: ClassSession) => {
    setSelectedClass(cls);
    setMode('confirm');
  };

  // QR Scanner view
  if (mode === 'scan') {
    if (!permission) {
      return (
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color={colors.warmAccent} />
        </SafeAreaView>
      );
    }

    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionIcon}>📷</Text>
            <Text style={styles.permissionTitle}>Camera Access</Text>
            <Text style={styles.permissionText}>
              We need camera access to scan the class QR code for check-in.
            </Text>
            <Button
              title="Grant Permission"
              onPress={requestPermission}
              variant="primary"
              style={styles.permissionButton}
            />
            <Button
              title="Select Class Manually"
              onPress={() => setMode('manual')}
              variant="outline"
              style={styles.manualButton}
            />
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scannerContainer}>
          {/* Header */}
          <View style={styles.scannerHeader}>
            <Text style={styles.screenTitle}>CHECK IN</Text>
            <Text style={styles.scanInstruction}>
              Point your camera at the class QR code
            </Text>
          </View>

          {/* Camera */}
          <View style={styles.cameraWrapper}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarCodeScanned}
            />
            {/* Overlay frame */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
            </View>
          </View>

          {/* Manual fallback */}
          <Pressable
            style={styles.manualLink}
            onPress={() => setMode('manual')}
          >
            <Text style={styles.manualLinkText}>
              Can't scan? Select class manually
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Manual class selection
  if (mode === 'manual') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.manualContainer}>
          <View style={styles.manualHeader}>
            <Pressable onPress={() => setMode('scan')}>
              <Text style={styles.backButton}>← Scan QR</Text>
            </Pressable>
            <Text style={styles.screenTitle}>SELECT CLASS</Text>
            <Text style={styles.scanInstruction}>
              Choose from today's available classes
            </Text>
          </View>

          <FlatList
            data={availableClasses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.classList}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleSelectClass(item)}>
                <Card style={styles.classCard}>
                  <Text style={styles.classTitle}>{item.name}</Text>
                  <View style={styles.classDetails}>
                    <Text style={styles.classDiscipline}>
                      {DISCIPLINE_LABELS[item.discipline]}
                    </Text>
                    <Text style={styles.classDot}>·</Text>
                    <Text style={styles.classInstructor}>
                      {item.instructorName}
                    </Text>
                  </View>
                  <View style={styles.classFooter}>
                    <Text style={styles.classLevel}>{item.level}</Text>
                    <Text style={styles.classCapacity}>
                      {item.enrolledCount}/{item.capacity} enrolled
                    </Text>
                  </View>
                </Card>
              </Pressable>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Confirm check-in
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.confirmContainer}>
        <Text style={styles.confirmIcon}>✅</Text>
        <Text style={styles.confirmTitle}>CONFIRM CHECK-IN</Text>

        {selectedClass ? (
          <Card style={styles.confirmCard}>
            <Text style={styles.confirmClassName}>{selectedClass.name}</Text>
            <Text style={styles.confirmDiscipline}>
              {DISCIPLINE_LABELS[selectedClass.discipline]}
            </Text>
            <Text style={styles.confirmInstructor}>
              with {selectedClass.instructorName}
            </Text>
          </Card>
        ) : (
          <Card style={styles.confirmCard}>
            <Text style={styles.confirmClassName}>QR Code Scanned</Text>
            <Text style={styles.confirmDiscipline}>Class detected</Text>
          </Card>
        )}

        <Button
          title="Confirm Check-In"
          onPress={handleConfirmCheckIn}
          isLoading={isCheckingIn}
          variant="primary"
          style={styles.confirmButton}
        />

        <Pressable
          onPress={() => {
            setMode('scan');
            setScannedData(null);
            setSelectedClass(null);
          }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.base,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  permissionTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.offWhite,
  },
  permissionText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    width: '100%',
    marginTop: spacing.md,
  },
  manualButton: {
    width: '100%',
  },
  // Scanner
  scannerContainer: {
    flex: 1,
  },
  scannerHeader: {
    padding: spacing.base,
    paddingTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  screenTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 32,
  },
  scanInstruction: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  cameraWrapper: {
    flex: 1,
    margin: spacing.base,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.warmAccent,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  manualLink: {
    padding: spacing.base,
    alignItems: 'center',
  },
  manualLinkText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.warmAccent,
    fontWeight: fonts.weight.medium,
  },
  // Manual
  manualContainer: {
    flex: 1,
  },
  manualHeader: {
    padding: spacing.base,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  backButton: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.warmAccent,
    marginBottom: spacing.sm,
  },
  classList: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  classCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  classTitle: {
    fontFamily: 'Inter',
    fontSize: fonts.size.md,
    fontWeight: fonts.weight.semibold,
    color: colors.offWhite,
  },
  classDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  classDiscipline: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.warmAccent,
    fontWeight: fonts.weight.medium,
  },
  classDot: {
    color: colors.steel,
    fontSize: fonts.size.sm,
  },
  classInstructor: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  classLevel: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: fonts.letterSpacing.widest * 11,
  },
  classCapacity: {
    fontFamily: 'Inter',
    fontSize: fonts.size.xs,
    color: colors.textMuted,
  },
  // Confirm
  confirmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
    gap: spacing.lg,
  },
  confirmIcon: {
    fontSize: 48,
  },
  confirmTitle: {
    fontFamily: 'BebasNeue',
    fontSize: fonts.size['2xl'],
    color: colors.offWhite,
    letterSpacing: fonts.letterSpacing.wide * 32,
  },
  confirmCard: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  confirmClassName: {
    fontFamily: 'Inter',
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.bold,
    color: colors.offWhite,
  },
  confirmDiscipline: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.warmAccent,
  },
  confirmInstructor: {
    fontFamily: 'Inter',
    fontSize: fonts.size.sm,
    color: colors.steel,
  },
  confirmButton: {
    width: '100%',
  },
  cancelText: {
    fontFamily: 'Inter',
    fontSize: fonts.size.base,
    color: colors.steel,
    marginTop: spacing.md,
  },
});
