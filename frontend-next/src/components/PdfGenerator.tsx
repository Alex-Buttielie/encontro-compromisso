'use client';

import { type ReactNode } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

interface PdfDocumentProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  fileName: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: 1, borderBottomColor: '#ccc', paddingBottom: 10 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
  section: { marginTop: 16 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 10 },
});

/**
 * PDF document generator powered by @react-pdf/renderer.
 *
 * Implements the Builder pattern: the document structure is
 * declaratively built using PDF primitives (Document, Page, Text, View),
 * and the caller provides the content via children.
 *
 * @example
 * <PdfGenerator title="Contrato" fileName="contrato.pdf">
 *   <PdfSection>Cláusula 1: ...</PdfSection>
 * </PdfGenerator>
 */
export function PdfGenerator({ title, subtitle, children, fileName }: PdfDocumentProps) {
  return (
    <PDFDownloadLink
      document={
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <View style={styles.section}>{children}</View>
            <Text style={styles.footer}>Gerado por Profissional OS</Text>
          </Page>
        </Document>
      }
      fileName={fileName}
    >
      {({ loading }) => (loading ? 'Gerando PDF...' : 'Baixar PDF')}
    </PDFDownloadLink>
  );
}

export { Document, Page, Text, View, StyleSheet as PdfStyleSheet };
